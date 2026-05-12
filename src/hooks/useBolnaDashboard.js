import { useState, useRef, useEffect, useCallback } from "react";
import { BATCH_SIZE, BATCH_DELAY_MS, POLL_INTERVAL_MS } from "../utils/constants";
import { sleep } from "../utils/helpers";
import { makeCall, fetchExecutionStatus, analyzeSummaryWithDeepSeek } from "../services/api";
import { parseContacts as parseContactsLogic } from "../services/fileService";
import { DEEPSEEK_API_KEY } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config";

export function useBolnaDashboard() {
  const { user } = useAuth();
  
  // --- STATE ---
  const [apiKey, setApiKey]         = useState("");
  const [agentId, setAgentId]       = useState(""); 
  const [availableAgents, setAvailableAgents] = useState([]); 
  const [contacts, setContacts]     = useState([]);
  const [logs, setLogs]             = useState([]);
  const [sessionContacts, setSessionContacts] = useState([]);
  const [isCalling, setIsCalling]   = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [showDone, setShowDone]     = useState(false);
  const [doneSummary, setDoneSummary] = useState("");
  const [xlsxReady, setXlsxReady]   = useState(false);
  const [activeView, setActiveView] = useState("calendar");
  const [detailsStatusTab, setDetailsStatusTab] = useState("all");
  const [responseTab, setResponseTab] = useState("");
  const [leadsStatusTab, setLeadsStatusTab] = useState("");
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [credits, setCredits] = useState(0);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [callStartTime, setCallStartTime] = useState(null);

  // --- REFS ---
  const contactsRef  = useRef([]);
  const callQueueRef = useRef([]);
  const pollRef      = useRef(null);

  // --- CALLBACKS & FUNCTIONS ---

  const addLog = useCallback((msg, type = "info") => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, ts, id: Date.now() + Math.random() }]);
  }, []);

  const fetchScheduledJobs = useCallback(async () => {
    if (!user || !user.userId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`);
      if (res.data.success) setScheduledJobs(res.data.jobs);
    } catch (err) {
      console.error("Failed to fetch scheduled jobs", err);
    }
  }, [user]);

  const saveContactsToDB = useCallback(async (contactsToSave) => {
    if (!user || !user.userId || !contactsToSave.length) return;
    try {
      await axios.post(`${API_BASE_URL}/api/contacts`, {
        userId: user.userId,
        contacts: contactsToSave
      });
      console.log("LEADS UPDATED");
    } catch (err) {
      console.error("Failed to save contacts to DB", err);
    }
  }, [user]);

  const checkIfAllDone = useCallback(() => {
    const cs = contactsRef.current;
    
    // Check if any scheduled job is still running locally
    const runningJob = scheduledJobs.find(j => j.status === 'Running-Acknowledge');
    
    const activeContacts = agentId ? cs.filter(c => c.agentId === agentId) : cs;
    const doneCount   = activeContacts.filter(c => c.status === "completed" || c.status === "called").length;
    const failedCount = activeContacts.filter(c => c.status === "failed").length;
    const inProgressCount = cs.filter(c => ["calling","queued"].includes(c.status)).length;
    
    if (inProgressCount === 0 && callQueueRef.current.length === 0) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      // If it was a scheduled job, mark as Completed on server
      if (runningJob) {
        axios.post(`${API_BASE_URL}/api/schedule/status`, { jobId: runningJob.id, status: 'Completed' })
          .then(() => fetchScheduledJobs());
      }

      setShowDone(true);
      setSessionContacts([]); 
      setDoneSummary(`${doneCount} call(s) completed successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`);
      setIsCalling(false);
      setCallStartTime(null);
      addLog(`All done. ${doneCount} called, ${failedCount} failed.`, "ok");
      
      if (user && user.userId) {
        axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`).then(res => {
          if (res.data && res.data.length > 0) {
            setContacts(res.data);
          }
        });
      }
    }
  }, [addLog, agentId, user, scheduledJobs, fetchScheduledJobs]);

  const updateContactStatus = useCallback((id, status, response = "", leadCategory = "", summary = "", recordingUrl = "") => {
    const now = new Date().toISOString().split('T')[0];
    const updated = contactsRef.current.map(c => 
      c.id === id ? { ...c, status, response, leadCategory, summary, recordingUrl: recordingUrl || c.recordingUrl || "", date: now } : c
    );
    
    setContacts(updated);
    contactsRef.current = updated;
    setSessionContacts(prev => prev.map(c => 
      c.id === id ? { ...c, status, response, leadCategory, summary, recordingUrl: recordingUrl || c.recordingUrl || "", date: now } : c
    ));
    
    console.log("CALL DETAILS UPDATED");
    const contact = updated.find(c => c.id === id);
    if (contact) saveContactsToDB([contact]);
  }, [saveContactsToDB]);

  const updateContactExecId = useCallback((id, executionId) => {
    const updated = contactsRef.current.map(c => c.id === id ? { ...c, executionId } : c);
    
    setContacts(updated);
    contactsRef.current = updated;
    setSessionContacts(prev => prev.map(c => c.id === id ? { ...c, executionId } : c));

    const contact = updated.find(c => c.id === id);
    if (contact) saveContactsToDB([contact]);
  }, [saveContactsToDB]);

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
          let category = "";
          const recordingUrl = data.telephony_data?.recording_url || "";
          if (data.summary) {
            category = await analyzeSummaryWithDeepSeek(DEEPSEEK_API_KEY, data.summary);
            console.log("RESPONSES UPDATED");
          }
          const finalStatus = sl === "completed" ? "called" : sl;
          updateContactStatus(contact.id, finalStatus, sl, category, data.summary || "", recordingUrl); 
          addLog(`✓ ${sl.toUpperCase()}: ${contact.name}${category ? ` (${category})` : ""}`, "ok"); 
        }
        else if (["failed","error","cancelled"].includes(sl)) { 
          updateContactStatus(contact.id, "failed", sl); 
          addLog(`✗ Failed: ${contact.name} — ${data.error_message || sl}`, "err"); 
        }
      } catch(e) { }
      await sleep(300);
    }
    checkIfAllDone();
  }, [addLog, checkIfAllDone, updateContactStatus]);

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
        const actualBolnaId = agId.includes('::') ? agId.split('::')[1] : agId;
        const execId = await makeCall(key, actualBolnaId, contact.phone, contact.name);
        updateContactExecId(id, execId);
        updateContactStatus(id, "calling");
        addLog(`✓ Call queued: ${contact.name} (${contact.phone}) → exec ${execId.slice(0,8)}…`, "ok");
        if (user && user.userId) {
          try {
            const creditRes = await axios.post(`${API_BASE_URL}/api/user-credits/deduct/${user.userId}`);
            if (creditRes.data.success) {
              setCredits(creditRes.data.credits);
            }
          } catch (creditErr) { }
        }
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
  }, [addLog, startPolling, updateContactExecId, updateContactStatus, user]);

  const addScheduledJob = async (jobData) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/api/schedule`, {
        ...jobData,
        userId: user.userId,
        apiKey
      });
      if (res.data.success) {
        setScheduledJobs(prev => [...prev, res.data.job]);
        return true;
      }
    } catch (err) {
      console.error("Failed to add scheduled job", err);
      alert("Failed to schedule calls: " + err.message);
    }
    return false;
  };

  const deleteScheduledJob = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/schedule/${id}`);
      if (res.data.success) {
        setScheduledJobs(prev => prev.filter(j => j.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete scheduled job", err);
    }
  };

  const startCalling = async (campaignTitle, scheduleDate, scheduleTime) => {
    if (!apiKey || !agentId) { alert("Please enter your Bolna API Key and Agent ID first."); return; }
    if (isCalling) return;
    if (!contacts.length) { alert("No contacts loaded."); return; }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();

    if (scheduledAt > now) {
      const agentName = agentId.includes('::') ? agentId.split('::')[0] : 'Default Agent';
      const success = await addScheduledJob({
        campaignTitle,
        agentId,
        agentName,
        contacts: sessionContacts,
        scheduledAt: scheduledAt.toISOString()
      });
      if (success) {
        alert(`Calls scheduled successfully for ${scheduleDate} at ${scheduleTime}`);
        setSessionContacts([]); 
      }
      return;
    }

    setIsCalling(true);
    setShowProgress(true);
    setShowDone(false);
    setCallStartTime(new Date());
    
    const activeContacts = contactsRef.current.filter(c => c.agentId === agentId);
    callQueueRef.current = activeContacts.filter(c => c.status === "pending" || c.status === "failed").map(c => c.id);
    
    addLog("Calls started — batching 10 every 10 minutes", "info");
    await dispatchNextBatch(apiKey, agentId);
  };

  const stopCalling = () => {
    if (!isCalling) return;
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    callQueueRef.current = [];
    setIsCalling(false);
    setCallStartTime(null);
    addLog("Calling process stopped by user. Upcoming queued calls cancelled.", "info");
  };

  function handleFile(file) {
    if (!xlsxReady) { alert("XLSX library not loaded yet, please wait."); return; }
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = window.XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = window.XLSX.utils.sheet_to_json(ws, { defval: "" });
        const parsed = parseContactsLogic(rows).map(c => ({
          ...c, 
          id: agentId ? `${agentId}::${c.id}` : c.id,
          agentId 
        }));
        
        if (!parsed.length) { alert("No valid contacts found."); return; }
        setSessionContacts(parsed);
        const updatedContacts = [...contactsRef.current, ...parsed];
        contactsRef.current = updatedContacts;
        setContacts(updatedContacts);
        setShowDone(false);
        setLogs([]);
        saveContactsToDB(parsed);
      } catch(err) { alert("Could not parse file: " + err.message); }
    };
    reader.readAsArrayBuffer(file);
  }

  // --- EFFECTS ---

  // Load XLSX from CDN
  useEffect(() => {
    if (window.XLSX) { setXlsxReady(true); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.onload = () => setXlsxReady(true);
    document.head.appendChild(s);
  }, []);

  // Fetch user config and contacts from backend
  useEffect(() => {
    const initData = async () => {
      if (user && user.userId) {
        try {
          const configRes = await axios.get(`${API_BASE_URL}/api/user-config/${user.userId}`);
          if (configRes.data.bolnaApiKey) setApiKey(configRes.data.bolnaApiKey);
          if (configRes.data.credits !== undefined) setCredits(configRes.data.credits);
          
          let currentAgents = [];
          if (configRes.data && configRes.data.bolnaAgentId) {
            const raw = configRes.data.bolnaAgentId;
            try {
              if (typeof raw === 'string' && (raw.startsWith('[') || raw.startsWith('{'))) {
                const parsed = JSON.parse(raw);
                currentAgents = Array.isArray(parsed) ? parsed : [parsed];
              } else {
                const legacyAgent = { name: 'Default Agent', id: raw };
                currentAgents = [legacyAgent];
              }
            } catch (e) {
              const legacyAgent = { name: 'Default Agent', id: raw };
              currentAgents = [legacyAgent];
            }
          }

          // Fetch custom agents and merge
          try {
            const customRes = await axios.get(`${API_BASE_URL}/api/custom-agents/${user.userId}`);
            console.log("FETCH_CUSTOM_AGENTS", { count: customRes.data.agents?.length });
            if (customRes.data.success && customRes.data.agents) {
              const customAgents = customRes.data.agents.map(a => ({
                name: a.agent_name,
                id: a.bolna_agent_id,
                isCustom: true,
                scriptType: a.script_type,
                script: a.script,
                voiceId: a.voice_id,
                voiceName: a.voice_name
              }));
              currentAgents = [...currentAgents, ...customAgents];
            }
          } catch (e) { 
            console.error("FETCH_CUSTOM_AGENTS_ERROR", e);
          }

          console.log("AVAILABLE_AGENTS_FINAL", currentAgents.map(a => ({ name: a.name, id: a.id, hasScript: !!a.script })));
          setAvailableAgents(currentAgents);
          if (currentAgents.length > 0 && !agentId) {
            const defaultId = `${currentAgents[0].name}::${currentAgents[0].id}`;
            console.log("AUTO_SELECT_AGENT", defaultId);
            setAgentId(defaultId);
          }

          const contactsRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
          if (contactsRes.data && contactsRes.data.length > 0) {
            const defaultAgentId = currentAgents.length > 0 ? `${currentAgents[0].name}::${currentAgents[0].id}` : '';
            const mappedContacts = contactsRes.data.map(c => {
              if (c.id && c.id.includes('::')) {
                const parts = c.id.split('::');
                if (parts.length >= 3) return { ...c, agentId: `${parts[0]}::${parts[1]}` };
                else if (parts.length === 2) return { ...c, agentId: parts[0] };
              }
              return { ...c, agentId: defaultAgentId };
            });
            setContacts(mappedContacts);
            contactsRef.current = mappedContacts;
          }
          const scheduleRes = await axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`);
          if (scheduleRes.data.success) setScheduledJobs(scheduleRes.data.jobs);
        } catch (err) { }
      }
    };
    initData();
  }, [user]);

  // Polling for Scheduled Jobs to detect status changes
  useEffect(() => {
    if (!user || !user.userId) return;
    const interval = setInterval(() => { fetchScheduledJobs(); }, 10000);
    return () => clearInterval(interval);
  }, [user, fetchScheduledJobs]);

  // Watch for Running jobs to activate manual calling pipeline
  useEffect(() => {
    const runningJob = scheduledJobs.find(j => j.status === 'Running');
    if (runningJob && !isCalling) {
      console.log("SCHEDULE TRIGGERED");
      console.log("START CALLING PIPELINE INVOKED");
      
      // Setup state for manual pipeline
      setIsCalling(true);
      setShowProgress(true);
      setShowDone(false);
      setAgentId(runningJob.agentId);
      setSessionContacts(runningJob.contacts);
      
      // Populate manual queue
      const contactsToCall = runningJob.contacts.filter(c => c.status === "pending" || c.status === "failed");
      callQueueRef.current = contactsToCall.map(c => c.id);
      
      addLog(`SCHEDULED PIPELINE: Starting "${runningJob.campaignTitle}"...`, "info");
      console.log("LIVE JOURNEY STARTED");

      // Mark the job as 'Running-Acknowledge' on server so we don't re-trigger it
      axios.post(`${API_BASE_URL}/api/schedule/status`, { jobId: runningJob.id, status: 'Running-Acknowledge' });

      // Start the manual pipeline
      if (apiKey) {
        dispatchNextBatch(apiKey, runningJob.agentId);
      }
    }
  }, [scheduledJobs, isCalling, apiKey, dispatchNextBatch, addLog, setAgentId]);

  // Auto-select first response tab
  useEffect(() => {
    if (activeView === "responses" && !responseTab && contacts.length > 0) {
      const uniqueResponses = Array.from(new Set(contacts.map(c => c.response).filter(r => r))).sort();
      if (uniqueResponses.length > 0) {
        setResponseTab(uniqueResponses[0]);
      }
    }
  }, [activeView, responseTab, contacts]);

  // sync contactsRef whenever contacts state changes
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  const displayContacts = agentId 
    ? contacts.filter(c => c.agentId === agentId)
    : contacts;

  const total   = displayContacts.length;
  const done    = displayContacts.filter(c => c.status === "completed" || c.status === "called").length;
  const active  = displayContacts.filter(c => c.status === "calling"   || c.status === "queued").length;
  const failed  = displayContacts.filter(c => c.status === "failed").length;
  const pct     = total > 0 ? Math.round(((done + failed) / total) * 100) : 0;

  // --- CUSTOM AGENT CREATION (Feature 3/4) ---
  const addCustomAgent = async (agentData) => {
    if (!user || !user.userId) return;
    console.log("SYNC_CUSTOM_AGENT_START", agentData);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/custom-agents`, {
        userId: user.userId,
        ...agentData
      });
      console.log("SYNC_CUSTOM_AGENT_RESPONSE", res.data);
      if (res.data.success) {
        const newAgent = {
          name: agentData.agentName,
          id: agentData.bolnaAgentId,
          isCustom: true,
          scriptType: agentData.scriptType,
          script: agentData.script,
          voiceId: agentData.voiceId,
          voiceName: agentData.voiceName
        };
        console.log("SYNC_CUSTOM_AGENT_SUCCESS", newAgent);
        setAvailableAgents(prev => [...prev, newAgent]);
        const selectionId = `${newAgent.name}::${newAgent.id}`;
        console.log("SELECTING_NEW_AGENT", selectionId);
        setAgentId(selectionId);
      }
    } catch (err) {
      console.error('Failed to save custom agent:', err);
      throw err;
    }
  };

  // --- RETRY CALLS (Feature 6) ---
  const retryCalls = async (contactIds) => {
    if (!apiKey || !agentId || isCalling) return;
    
    // Reset selected contacts to pending
    const updated = contactsRef.current.map(c =>
      contactIds.includes(c.id) ? { ...c, status: 'pending', response: '', leadCategory: '', summary: '' } : c
    );
    contactsRef.current = updated;
    setContacts(updated);
    
    const retryContacts = updated.filter(c => contactIds.includes(c.id));
    setSessionContacts(retryContacts);
    
    setIsCalling(true);
    setShowProgress(true);
    setShowDone(false);
    setCallStartTime(new Date());
    
    callQueueRef.current = contactIds;
    addLog(`Retrying ${contactIds.length} call(s)...`, 'info');
    await dispatchNextBatch(apiKey, agentId);
  };

  return {
    apiKey, setApiKey,
    agentId, setAgentId,
    contacts: displayContacts, setContacts,
    sessionContacts, setSessionContacts,
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
    stopCalling,
    availableAgents, setAvailableAgents,
    stats: { total, done, active, failed, pct },
    credits,
    scheduledJobs,
    deleteScheduledJob,
    fetchScheduledJobs,
    callStartTime,
    addCustomAgent,
    retryCalls
  };
}
