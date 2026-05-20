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
  const [campaigns, setCampaigns] = useState([]);
  const [callStartTime, setCallStartTime] = useState(null);

  // --- REFS ---
  const contactsRef  = useRef([]);
  const callQueueRef = useRef([]);
  const pollRef      = useRef(null);
  const processedJobIdsRef = useRef(new Set());

  // --- CALLBACKS & FUNCTIONS ---

  const addLog = useCallback((msg, type = "info") => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { msg, type, ts, id: Date.now() + Math.random() }]);
  }, []);

  const fetchScheduledJobs = useCallback(async () => {
    if (!user || !user.userId) return;
    try {
      const scheduleRes = await axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`);
      if (scheduleRes.data.success) setScheduledJobs(scheduleRes.data.jobs);
    } catch (err) {
      console.error("Failed to fetch scheduled jobs:", err);
    }
    try {
      const campaignRes = await axios.get(`${API_BASE_URL}/api/campaigns/${user.userId}`);
      if (campaignRes.data.success) setCampaigns(campaignRes.data.campaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    }
    try {
      const contactRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
      if (contactRes.data) {
        setContacts(contactRes.data);
        contactsRef.current = contactRes.data;
      }
    } catch (err) {
      console.error("Failed to fetch contacts:", err);
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
      if (user && user.userId) {
        axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`).then(res => {
          if (res.data && res.data.length > 0) {
            setContacts(res.data);
          }
        });
      }
      addLog(`Campaign completion detected. Final stats: ${doneCount} called, ${failedCount} failed.`, "ok");
      console.log(`[Campaign] Finished: ${doneCount} success, ${failedCount} fail`);
    }
  }, [addLog, agentId, user, scheduledJobs, fetchScheduledJobs]);

  const updateContactStatus = useCallback((id, status, response = "", leadCategory = "", summary = "", recordingUrl = "", duration = null) => {
    const now = new Date().toISOString().split('T')[0];
    const updated = contactsRef.current.map(c => 
      c.id === id ? { 
        ...c, 
        status, 
        response, 
        leadCategory, 
        summary, 
        recordingUrl: recordingUrl || c.recordingUrl || "", 
        date: now,
        duration: duration !== null ? duration : c.duration
      } : c
    );
    
    setContacts(updated);
    contactsRef.current = updated;
    setSessionContacts(prev => prev.map(c => 
      c.id === id ? { 
        ...c, 
        status, 
        response, 
        leadCategory, 
        summary, 
        recordingUrl: recordingUrl || c.recordingUrl || "", 
        date: now,
        duration: duration !== null ? duration : c.duration
      } : c
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
    // Poll for active calls OR completed calls that haven't been analyzed yet
    const inProgress = contactsRef.current.filter(c => 
      c.executionId && (
        c.status === "calling" || 
        c.status === "queued" || 
        ((c.status === "called" || c.status === "completed") && !c.leadCategory)
      )
    );
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
          const duration = data.conversation_duration || data.telephony_data?.duration || 0;
          updateContactStatus(contact.id, finalStatus, sl, category, data.summary || "", recordingUrl, duration); 
          addLog(`✓ ${sl.toUpperCase()}: ${contact.name}${category ? ` (${category})` : ""}`, "ok"); 

          // Deduct credit only for successfully completed calls
          if (sl === "completed") {
            try {
              const creditRes = await axios.post(`${API_BASE_URL}/api/user-credits/deduct/${user.userId}`);
              if (creditRes.data.success) {
                setCredits(creditRes.data.credits);
              }
            } catch (creditErr) {
              console.error("Credit deduction failed", creditErr);
            }
          }
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
        addLog(`✓ Call triggered: ${contact.name} (${contact.phone})`, "ok");
        console.log(`[Call] Started: ${contact.name} (${contact.phone}) -> exec ${execId.slice(0,8)}`);
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
        // Immediately refetch jobs so the Running job is detected by the useEffect
        await fetchScheduledJobs();
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
    if (!apiKey || !agentId) { alert("Please enter your CallingGen API Key and Agent ID first."); return; }
    if (isCalling) return;
    if (!contacts.length) { alert("No contacts loaded."); return; }

    // Credit validation
    if (credits <= 0) {
      // alert("Insufficient credits. Please upgrade your plan or add credits to continue.");
      return;
    }

    if (sessionContacts.length > credits) {
      alert(`You only have ${credits} credits remaining, but you are trying to call ${sessionContacts.length} contacts. Please reduce the contact list or add credits.`);
      return;
    }



    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
    const now = new Date();
    const isImmediate = scheduledAt <= now;
    const agentName = agentId.includes('::') ? agentId.split('::')[0] : 'Default Agent';

    const success = await addScheduledJob({
      campaignTitle,
      agentId,
      agentName,
      contacts: sessionContacts,
      scheduledAt: isImmediate ? now.toISOString() : scheduledAt.toISOString(),
      status: isImmediate ? 'Running' : 'Scheduled',
      sheetName: sessionContacts[0]?.sheetName || 'N/A'
    });

    if (success) {
      if (isImmediate) {
        addLog(`Immediate campaign "${campaignTitle}" created. Triggering calls...`, "info");
        console.log(`[Campaign] Immediate start: ${campaignTitle} (${sessionContacts.length} numbers)`);
      } else {
        alert(`Calls scheduled successfully for ${scheduleDate} at ${scheduleTime}`);
        addLog(`Campaign "${campaignTitle}" scheduled for ${scheduleDate} ${scheduleTime}`, "info");
        console.log(`[Campaign] Scheduled: ${campaignTitle} at ${scheduleDate} ${scheduleTime}`);
        setSessionContacts([]); // Only clear if NOT immediate
      }
    }
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
          agentId,
          sheetName: file.name
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
      if (!user || !user.userId) return;

      let currentAgents = [];
      
      // 1. Fetch user configuration
      try {
        const configRes = await axios.get(`${API_BASE_URL}/api/user-config/${user.userId}`);
        if (configRes.data) {
          if (configRes.data.bolnaApiKey) setApiKey(configRes.data.bolnaApiKey);
          if (configRes.data.credits !== undefined) setCredits(configRes.data.credits);
          
          if (configRes.data.bolnaAgentId) {
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

          console.log("AVAILABLE_AGENTS_FINAL", currentAgents.map(a => ({ name: a.name, id: a.id, hasScript: !!a.script })));
          setAvailableAgents(currentAgents);
          if (currentAgents.length > 0 && !agentId) {
            const defaultId = `${currentAgents[0].name}::${currentAgents[0].id}`;
            console.log("AUTO_SELECT_AGENT", defaultId);
            setAgentId(defaultId);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user config on login:", err);
      }

      // 2. Fetch contacts (Ensure this ALWAYS runs even if config fails)
      try {
        const contactsRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
        if (contactsRes.data && contactsRes.data.length > 0) {
          const defaultAgentId = currentAgents.length > 0 ? `${currentAgents[0].name}::${currentAgents[0].id}` : '';
          const mappedContacts = contactsRes.data.map(c => {
            if (c.id && c.id.includes('::')) {
              const parts = c.id.split('::');
              if (parts.length >= 3) return { ...c, agentId: `${parts[0]}::${parts[1]}` };
              else if (parts.length === 2) return { ...c, agentId: parts[0] };
            }
            return { ...c, agentId: c.agentId || defaultAgentId };
          });
          setContacts(mappedContacts);
          contactsRef.current = mappedContacts;
        } else {
          setContacts([]);
          contactsRef.current = [];
        }
      } catch (err) {
        console.error("Failed to fetch contacts on login:", err);
        setContacts([]);
        contactsRef.current = [];
      }

      // 3. Fetch scheduled jobs
      try {
        const scheduleRes = await axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`);
        if (scheduleRes.data.success) {
          setScheduledJobs(scheduleRes.data.jobs);
        }
      } catch (err) {
        console.error("Failed to fetch schedule on login:", err);
      }
    };
    initData();
  }, [user]);

  // Fetch / re-fetch contacts on view changes to details, responses, leads
  useEffect(() => {
    if (!user || !user.userId) return;
    if (["details", "responses", "leads"].includes(activeView)) {
      const refetchContacts = async () => {
        try {
          const contactsRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
          if (contactsRes.data) {
            const defaultAgentId = availableAgents.length > 0 ? `${availableAgents[0].name}::${availableAgents[0].id}` : '';
            const mappedContacts = contactsRes.data.map(c => {
              if (c.id && c.id.includes('::')) {
                const parts = c.id.split('::');
                if (parts.length >= 3) return { ...c, agentId: `${parts[0]}::${parts[1]}` };
                else if (parts.length === 2) return { ...c, agentId: parts[0] };
              }
              return { ...c, agentId: c.agentId || defaultAgentId };
            });
            setContacts(mappedContacts);
            contactsRef.current = mappedContacts;
            console.log(`[useBolnaDashboard] Auto-refetched ${mappedContacts.length} contacts for view "${activeView}"`);
          }
        } catch (err) {
          console.error("Failed to refetch contacts on view change:", err);
        }
      };
      refetchContacts();
    }
  }, [activeView, user, availableAgents]);


  // Polling for Scheduled Jobs to detect status changes
  useEffect(() => {
    if (!user || !user.userId) return;
    const interval = setInterval(() => { fetchScheduledJobs(); }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [user, fetchScheduledJobs, activeView]);

  // Watch for Running jobs to activate manual calling pipeline
  useEffect(() => {
    const runningJob = scheduledJobs.find(j => j.status === 'Running');
    if (runningJob && !isCalling && !processedJobIdsRef.current.has(runningJob.id)) {
      console.log("SCHEDULE TRIGGERED", runningJob.id);
      processedJobIdsRef.current.add(runningJob.id);
      
      // Use API key from job if local state is missing
      const activeKey = apiKey || runningJob.apiKey;
      const activeAgentId = runningJob.agentId;

      if (!activeKey) {
        addLog(`Cannot start scheduled job: No API Key found for this campaign.`, "err");
        return;
      }

      // Sync state for UI consistency
      setApiKey(activeKey);
      setAgentId(activeAgentId);
      
      // Setup state for manual pipeline
      setIsCalling(true);
      setShowProgress(true);
      setShowDone(false);
      
      // Sync contacts to main state so stats and views update
      setSessionContacts(runningJob.contacts);
      setContacts(prev => {
        const existingIds = new Set(prev.map(c => c.id));
        const newOnes = runningJob.contacts.filter(c => !existingIds.has(c.id));
        return [...prev, ...newOnes];
      });
      
      // Populate manual queue
      const contactsToCall = runningJob.contacts.filter(c => c.status === "pending" || c.status === "failed");
      callQueueRef.current = contactsToCall.map(c => c.id);
      
      addLog(`SCHEDULED PIPELINE: Starting "${runningJob.campaignTitle || runningJob.title}" with ${contactsToCall.length} pending calls...`, "info");
      console.log(`[Pipeline] Triggered for job ${runningJob.id}. Total: ${runningJob.contacts.length}, Pending: ${contactsToCall.length}`);

      // Mark the job as 'Running-Acknowledge' on server so we don't re-trigger it
      axios.post(`${API_BASE_URL}/api/schedule/status`, { jobId: runningJob.id, status: 'Running-Acknowledge' })
        .catch(err => console.error("Failed to acknowledge job status", err));

      // Start the manual pipeline
      dispatchNextBatch(activeKey, activeAgentId);
    }
  }, [scheduledJobs, isCalling, apiKey, dispatchNextBatch, addLog, setAgentId, setContacts]);



  // sync contactsRef whenever contacts state changes
  useEffect(() => { contactsRef.current = contacts; }, [contacts]);

  const displayContacts = agentId 
    ? contacts.filter(c => c.agentId === agentId)
    : contacts;

  const total    = displayContacts.length;
  const done     = displayContacts.filter(c => c.status === "called" || c.status === "completed").length;
  const active   = displayContacts.filter(c => ["calling","queued","processing"].includes(c.status)).length;
  const failed   = displayContacts.filter(c => c.status === "failed").length;
  const pending  = displayContacts.filter(c => !c.status || c.status === "pending").length;
  const pct      = total > 0 ? Math.round((done / total) * 100) : 0;

  const stats = { 
    total, 
    totalCalls: total,
    done, 
    connected: done,
    active, 
    failed, 
    pending, 
    pct,
    leadsCount: displayContacts.filter(c => c.leadCategory && c.leadCategory !== '').length
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
    allContacts: contacts,
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
    stats,
    credits,
    scheduledJobs,
    campaigns,
    deleteScheduledJob,
    fetchScheduledJobs,
    retryCalls,
    callStartTime
  };
}
