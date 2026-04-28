import { useState, useRef, useEffect, useCallback } from "react";
import { BATCH_SIZE, BATCH_DELAY_MS, POLL_INTERVAL_MS } from "../utils/constants";
import { sleep } from "../utils/helpers";
import { makeCall, fetchExecutionStatus, analyzeSummaryWithDeepSeek } from "../services/api";
import { parseContacts as parseContactsLogic } from "../services/fileService";
import { DEEPSEEK_API_KEY } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export function useBolnaDashboard() {
  const { user } = useAuth();
  const [apiKey, setApiKey]         = useState("");
  const [agentId, setAgentId]       = useState("");
  const [contacts, setContacts]     = useState([]);
  const [logs, setLogs]             = useState([]);
  const [isCalling, setIsCalling]   = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showDone, setShowDone]     = useState(false);
  const [doneSummary, setDoneSummary] = useState("");
  const [xlsxReady, setXlsxReady]   = useState(false);
  const [activeView, setActiveView] = useState("manager");
  const [detailsStatusTab, setDetailsStatusTab] = useState("all");
  const [responseTab, setResponseTab] = useState("");
  const [leadsStatusTab, setLeadsStatusTab] = useState("interested");
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch user config from backend
  useEffect(() => {
    const fetchConfig = async () => {
      if (user && user.userId) {
        try {
          const res = await axios.get(`http://localhost:5000/api/user-config/${user.userId}`);
          if (res.data.bolnaApiKey) setApiKey(res.data.bolnaApiKey);
          if (res.data.bolnaAgentId) setAgentId(res.data.bolnaAgentId);
        } catch (err) {
          console.error("Failed to fetch user config", err);
        }
      }
    };
    fetchConfig();
  }, [user]);

  // Auto-select first response tab when entering responses view
  useEffect(() => {
    if (activeView === "responses" && !responseTab && contacts.length > 0) {
      const uniqueResponses = Array.from(new Set(contacts.map(c => c.response).filter(r => r))).sort();
      if (uniqueResponses.length > 0) {
        setResponseTab(uniqueResponses[0]);
      }
    }
  }, [activeView, responseTab, contacts]);

  const contactsRef  = useRef([]);
  const callQueueRef = useRef([]);
  const pollRef      = useRef(null);

  // Load XLSX from CDN
  useEffect(() => {
    if (window.XLSX) { setXlsxReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setXlsxReady(true);
    document.head.appendChild(s);
  }, []);

  const addLog = useCallback((msg, type = "info") => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, ts, id: Date.now() + Math.random() }]);
  }, []);

  // sync contactsRef whenever contacts state changes
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  function updateContactStatus(id, status, response = "", leadCategory = "") {
    const now = new Date().toISOString().split('T')[0];
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status, response, leadCategory, date: now } : c));
    const idx = contactsRef.current.findIndex(c => c.id === id);
    if (idx !== -1) {
      contactsRef.current[idx].status = status;
      contactsRef.current[idx].response = response;
      contactsRef.current[idx].leadCategory = leadCategory;
      contactsRef.current[idx].date = now;
    }
  }

  function updateContactExecId(id, execId) {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, executionId: execId } : c));
    const idx = contactsRef.current.findIndex(c => c.id === id);
    if (idx !== -1) contactsRef.current[idx].executionId = execId;
  }

  function handleFile(file) {
    if (!xlsxReady) { alert("XLSX library not loaded yet, please wait."); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = window.XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
        const parsed = parseContactsLogic(rows);
        if (!parsed.length) { alert("No valid contacts found."); return; }
        contactsRef.current = parsed;
        setContacts(parsed);
        setShowDone(false);
        setLogs([]);
      } catch(err) { alert("Could not parse file: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }

  const checkIfAllDone = useCallback(() => {
    const cs = contactsRef.current;
    const doneCount   = cs.filter(c => c.status === "completed" || c.status === "called").length;
    const failedCount = cs.filter(c => c.status === "failed").length;
    const pendingCount = cs.filter(c => ["pending","calling","queued"].includes(c.status)).length;
    
    if (pendingCount === 0 && callQueueRef.current.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setShowDone(true);
      setDoneSummary(`${doneCount} call(s) completed successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`);
      setIsCalling(false);
      addLog(`All done. ${doneCount} called, ${failedCount} failed.`, "ok");
    }
  }, [addLog]);

  const pollStatuses = useCallback(async (key) => {
    const inProgress = contactsRef.current.filter(c => c.executionId && (c.status === "calling" || c.status === "queued"));
    if (!inProgress.length) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      checkIfAllDone();
      return;
    }
    for (const contact of inProgress) {
      try {
        const data = await fetchExecutionStatus(key, contact.executionId);
        if (!data) continue;
        const sl = (data.status || "").toLowerCase();
        const isSuccess = ["completed","no answer","no_answer","call disconnected","call_disconnected","busy"].includes(sl);
        if (isSuccess) { 
          // Perform AI Analysis on summary if available
          let category = "";
          if (data.summary) {
            category = await analyzeSummaryWithDeepSeek(DEEPSEEK_API_KEY, data.summary);
          }
          updateContactStatus(contact.id, "called", sl, category); 
          addLog(`✓ Called: ${contact.name}${category ? ` (${category})` : ""}`, "ok"); 
        }
        else if (["failed","error","cancelled"].includes(sl)) { 
          updateContactStatus(contact.id, "failed", sl); 
          addLog(`✗ Failed: ${contact.name} — ${data.error_message || sl}`, "err"); 
        }
      } catch(e) { /* ignore */ }
      await sleep(300);
    }
    checkIfAllDone();
  }, [addLog, checkIfAllDone]);

  const startPolling = useCallback((key) => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => pollStatuses(key), POLL_INTERVAL_MS);
    pollStatuses(key);
  }, [pollStatuses]);

  const dispatchNextBatch = useCallback(async (key, agId) => {
    if (!callQueueRef.current.length) { 
      addLog("All calls dispatched, monitoring statuses…", "info"); 
      startPolling(key); 
      return; 
    }
    const batch = callQueueRef.current.splice(0, BATCH_SIZE);
    addLog(`Dispatching batch of ${batch.length} call(s)…`, "info");
    for (const id of batch) {
      const contact = contactsRef.current.find(c => c.id === id);
      if (!contact) continue;
      updateContactStatus(id, "queued");
      try {
        const execId = await makeCall(key, agId, contact.phone);
        updateContactExecId(id, execId);
        updateContactStatus(id, "calling");
        addLog(`✓ Call queued: ${contact.name} (${contact.phone}) → exec ${execId.slice(0,8)}…`, "ok");
      } catch(err) {
        updateContactStatus(id, "failed", err.message);
        addLog(`✗ Failed to call ${contact.name}: ${err.message}`, "err");
      }
      await sleep(600);
    }
    startPolling(key);
    if (callQueueRef.current.length > 0) {
      addLog(`Next batch in 10 minutes (${callQueueRef.current.length} remaining)…`, "info");
      setTimeout(() => dispatchNextBatch(key, agId), BATCH_DELAY_MS);
    }
  }, [addLog, startPolling]);

  const startCalling = async () => {
    if (!apiKey || !agentId) { alert("Please enter your Bolna API Key and Agent ID first."); return; }
    if (isCalling) return;
    if (!contacts.length) { alert("No contacts loaded."); return; }
    setIsCalling(true);
    setShowProgress(true);
    setShowDone(false);
    callQueueRef.current = contactsRef.current.filter(c => c.status === "pending" || c.status === "failed").map(c => c.id);
    addLog("Calls started — batching 10 every 10 minutes", "info");
    await dispatchNextBatch(apiKey, agentId);
  };

  const total   = contacts.length;
  const done    = contacts.filter(c => c.status === "completed" || c.status === "called").length;
  const active  = contacts.filter(c => c.status === "calling"   || c.status === "queued").length;
  const failed  = contacts.filter(c => c.status === "failed").length;
  const pct     = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;

  return {
    apiKey, setApiKey,
    agentId, setAgentId,
    contacts, setContacts,
    logs, setLogs,
    isCalling, setIsCalling,
    showProgress, setShowProgress,
    showDone, setShowDone,
    doneSummary, setDoneSummary,
    xlsxReady, setXlsxReady,
    activeView, setActiveView,
    detailsStatusTab, setDetailsStatusTab,
    responseTab, setResponseTab,
    leadsStatusTab, setLeadsStatusTab,
    searchDate, setSearchDate,
    handleFile,
    startCalling,
    stats: { total, done, active, failed, pct }
  };
}
