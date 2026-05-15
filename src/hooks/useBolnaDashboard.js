import { useState, useRef, useEffect, useCallback } from "react";
import { BATCH_SIZE, BATCH_DELAY_MS, POLL_INTERVAL_MS } from "../utils/constants";
import { sleep } from "../utils/helpers";
import { makeCall, fetchExecutionStatus, fetchInboundCalls } from "../services/api";
import { parseContacts as parseContactsLogic } from "../services/fileService";
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
  const [inboundCalls, setInboundCalls] = useState([]);
  const [isLoadingInbound, setIsLoadingInbound] = useState(false);
  const [activeCampaignId, setActiveCampaignId] = useState(null);

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
      const [scheduleRes, campaignRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`),
        axios.get(`${API_BASE_URL}/api/campaigns/${user.userId}`)
      ]);
      if (scheduleRes.data.success) setScheduledJobs(scheduleRes.data.jobs);
      if (campaignRes.data.success) setCampaigns(campaignRes.data.campaigns);
    } catch (err) {
      console.error("Failed to fetch scheduled jobs:", err);
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
      
      // Refetch credits to keep UI in sync
      const creditRes = await axios.get(`${API_BASE_URL}/api/user-credits/${user.userId}`);
      if (creditRes.data.credits !== undefined) {
        setCredits(creditRes.data.credits);
      }
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
          .then(() => {
            fetchScheduledJobs();
            // Refresh campaigns list too
            axios.get(`${API_BASE_URL}/api/campaigns/list/${user.userId}`).then(res => {
               if (res.data.success) setCampaigns(res.data.campaigns);
            });
          });
      }

      setShowDone(true);
      setSessionContacts([]); 
      setDoneSummary(`${doneCount} call(s) completed successfully${failedCount > 0 ? `, ${failedCount} failed` : ""}.`);
      setIsCalling(false);
      setCallStartTime(null);
      setActiveCampaignId(null);
      addLog(`Campaign Finished. ${doneCount} called, ${failedCount} failed.`, "ok");
      
      // Refresh all data from server to ensure all pages are up to date
      if (user && user.userId) {
        // Refresh contacts
        axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`).then(res => {
          if (res.data) {
            setContacts(res.data);
            contactsRef.current = res.data;
          }
        }).catch(() => {});
        
        // Refresh credits (may have been deducted by backend)
        axios.get(`${API_BASE_URL}/api/user-credits/${user.userId}`).then(res => {
          if (res.data.credits !== undefined) {
            setCredits(res.data.credits);
          }
        }).catch(() => {});
        
        // Refresh campaigns
        axios.get(`${API_BASE_URL}/api/campaigns/list/${user.userId}`).then(res => {
          if (res.data.success) setCampaigns(res.data.campaigns);
        }).catch(() => {});
      }
    }
  }, [addLog, agentId, user, scheduledJobs, fetchScheduledJobs]);

  const updateContactStatus = useCallback((id, status, response = "", leadCategory = "", summary = "", recordingUrl = "") => {
    const now = new Date().toISOString().split('T')[0];
    const updated = contactsRef.current.map(c => 
      c.id === id ? { ...c, status, response, leadCategory, summary, recordingUrl: recordingUrl || c.recordingUrl || "", date: now, campaignId: c.campaignId || activeCampaignId } : c
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
          const recordingUrl = data.telephony_data?.recording_url || "";
          const finalStatus = sl === "completed" ? "called" : sl;
          updateContactStatus(contact.id, finalStatus, sl, "", data.summary || "", recordingUrl); 
          addLog(`✓ ${sl.toUpperCase()}: ${contact.name}`, "ok"); 

          // Trigger full backend pipeline: DeepSeek AI + Leads + Responses + Credits
          if (user && user.userId && contact.executionId) {
            axios.post(`${API_BASE_URL}/api/sync-outbound/${user.userId}`, { 
              executionIds: [contact.executionId] 
            }).then(() => {
              console.log(`[SYNC] Backend pipeline triggered for ${contact.executionId}`);
              // Re-fetch contacts from DB after pipeline completes to get AI categories
              setTimeout(() => {
                axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`).then(res => {
                  if (res.data && res.data.length > 0) {
                    const defaultAgentId = agentId || '';
                    const mappedContacts = res.data.map(c => {
                      let aId = defaultAgentId;
                      let aName = defaultAgentId.split('::')[0];
                      if (c.id && c.id.includes('::')) {
                        const parts = c.id.split('::');
                        if (parts.length >= 3) { aId = `${parts[0]}::${parts[1]}`; aName = parts[0]; }
                        else if (parts.length === 2) { aId = parts[0]; aName = parts[0]; }
                      }
                      return { ...c, agentId: aId, agentName: aName };
                    });
                    setContacts(mappedContacts);
                    contactsRef.current = mappedContacts;
                    console.log(`[SYNC] Contacts refreshed from DB (${mappedContacts.length} records)`);
                  }
                }).catch(() => {});
                // Also refresh credits
                axios.get(`${API_BASE_URL}/api/user-credits/${user.userId}`).then(res => {
                  if (res.data.credits !== undefined) setCredits(res.data.credits);
                }).catch(() => {});
              }, 3000); // Wait 3s for backend pipeline to finish
            }).catch(e => console.error("[SYNC] Backend pipeline failed:", e.message));
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
      
      // CRITICAL: Double check status before placing call to prevent duplicates/loops
      if (contact.status === "called" || contact.status === "completed" || contact.status === "calling") {
        console.log(`Skipping contact ${contact.name} - Status is already ${contact.status}`);
        continue;
      }

      updateContactStatus(id, "queued");
      try {
        const agIdStr = String(agId || "");
        const actualBolnaId = agIdStr.includes('::') ? agIdStr.split('::')[1] : agIdStr;
        
        if (!actualBolnaId) {
          throw new Error("No valid Bolna Agent ID found.");
        }

        const execId = await makeCall(key, actualBolnaId, contact.phone, contact.name);
        updateContactExecId(id, execId);
        updateContactStatus(id, "calling");
        addLog(`✓ Call placed: ${contact.name} (${contact.phone}) → exec ${execId.slice(0,8)}…`, "ok");
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
    try {
      if (!apiKey || !agentId) { 
        alert("Please enter your Bolna API Key and Agent ID first."); 
        return; 
      }
      if (isCalling) return;
      if (!contacts.length) { 
        alert("No contacts loaded. Please upload a sheet first."); 
        return; 
      }

      // Credit validation
      if (credits <= 0) {
        alert("Insufficient credits. Please add credits to continue.");
        return;
      }

      if (sessionContacts.length > credits) {
        alert(`You only have ${credits} credits remaining, but you are trying to call ${sessionContacts.length} contacts.`);
        return;
      }

      // Plan validation for Starter
      if (user && user.selectedPlan === 'Starter') {
        const today = new Date().toISOString().split('T')[0];
        const activeJobs = (scheduledJobs || []).filter(j => 
          j && ['Scheduled', 'Running', 'Running-Acknowledge'].includes(j.status) && 
          j.scheduledAt && j.scheduledAt.startsWith(today)
        );
        
        if (activeJobs.length > 0) {
          alert("Starter plan is limited to 1 active/scheduled campaign per day.");
          return;
        }
      }

      if (!scheduleDate || !scheduleTime) {
        alert("Please select a valid date and time for the campaign.");
        return;
      }

      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(scheduledAt.getTime())) {
        alert("Invalid date or time format. Please re-select.");
        return;
      }

      const now = new Date();
      const isImmediate = scheduledAt <= now;
      const agentName = (typeof agentId === 'string' && agentId.includes('::')) ? agentId.split('::')[0] : 'Default Agent';

      const success = await addScheduledJob({
        campaignTitle: campaignTitle || 'Untitled Campaign',
        agentId,
        agentName,
        contacts: sessionContacts,
        scheduledAt: isImmediate ? now.toISOString() : scheduledAt.toISOString(),
        status: isImmediate ? 'Running' : 'Scheduled',
        sheetName: sessionContacts[0]?.sheetName || 'N/A'
      });

      if (success) {
        if (isImmediate) {
          addLog(`Immediate campaign "${campaignTitle || 'Untitled'}" created and starting...`, "info");
        } else {
          alert(`Calls scheduled successfully for ${scheduleDate} at ${scheduleTime}`);
        }
        setSessionContacts([]); 
      }
    } catch (err) {
      console.error("Crash in startCalling:", err);
      alert("An unexpected error occurred while scheduling calls. Please check your configuration.");
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
              let aId = defaultAgentId;
              let aName = defaultAgentId.split('::')[0];

              if (c.id && c.id.includes('::')) {
                const parts = c.id.split('::');
                // Format is Name::ID::ContactId
                if (parts.length >= 3) {
                  aId = `${parts[0]}::${parts[1]}`;
                  aName = parts[0];
                } else if (parts.length === 2) {
                  aId = parts[0]; // Legacy or simple format
                  aName = parts[0].includes('::') ? parts[0].split('::')[0] : parts[0];
                }
              }
              return { ...c, agentId: aId, agentName: aName };
            });
            setContacts(mappedContacts);
            contactsRef.current = mappedContacts;
          }
          const scheduleRes = await axios.get(`${API_BASE_URL}/api/schedule/${user.userId}`);
          if (scheduleRes.data.success) setScheduledJobs(scheduleRes.data.jobs);

          // Initial inbound sync/fetch
          axios.post(`${API_BASE_URL}/api/inbound-calls/sync/${user.userId}`)
            .then(res => {
              if (res.data.success) setInboundCalls(res.data.calls || []);
            })
            .catch(() => {
              axios.get(`${API_BASE_URL}/api/inbound-calls/${user.userId}`)
                .then(res => {
                  if (res.data.success) setInboundCalls(res.data.calls || []);
                })
                .catch(() => {});
            });
        } catch (err) { }
      }
    };
    initData();
  }, [user]);

  // Polling for Scheduled Jobs to detect status changes
  useEffect(() => {
    if (!user || !user.userId) return;
    const interval = setInterval(() => { fetchScheduledJobs(); }, 10000);
    const inboundInterval = setInterval(() => {
      if (activeView === 'inbound') {
        axios.post(`${API_BASE_URL}/api/inbound-calls/sync/${user.userId}`)
          .then(res => {
            if (res.data.success) setInboundCalls(res.data.calls || []);
          })
          .catch(() => {});
      }
    }, 30000); // Poll inbound every 30s when on inbound view

    return () => {
      clearInterval(interval);
      clearInterval(inboundInterval);
    };
  }, [user, fetchScheduledJobs, activeView]);

  // Watch for Running jobs to activate manual calling pipeline
  const processedJobIdsRef = useRef(new Set());

  useEffect(() => {
    if (!scheduledJobs || !Array.isArray(scheduledJobs) || isCalling) return;
    
    const runningJob = scheduledJobs.find(j => j && j.status === 'Running' && !processedJobIdsRef.current.has(j.id));
    if (runningJob) {
      try {
        console.log("SCHEDULE TRIGGERED", runningJob.id);
        processedJobIdsRef.current.add(runningJob.id);

        // Ensure contacts exist before processing
        const jobContacts = runningJob.contacts || [];
        if (!Array.isArray(jobContacts) || jobContacts.length === 0) {
          console.warn("Running job has no valid contacts", runningJob.id);
          return;
        }

        // Setup state for manual pipeline
        setIsCalling(true);
        setShowProgress(true);
        setShowDone(false);
        setAgentId(runningJob.agentId || "");
        setActiveCampaignId(runningJob.id);
        
        // SYNC: Filter job contacts against real-time contact status to prevent duplicate calls
        const contactsToCall = jobContacts.filter(jc => {
          if (!jc) return false;
          // Find the most recent status from our main contacts state
          const realTimeContact = (contactsRef.current || []).find(c => c && (c.id === jc.id || c.phone === jc.phone));
          const currentStatus = realTimeContact ? realTimeContact.status : jc.status;
          return currentStatus === "pending" || currentStatus === "failed";
        });

        if (contactsToCall.length === 0) {
          console.log("All contacts in this job are already called or completed.");
          // Mark as completed immediately if no pending contacts
          axios.post(`${API_BASE_URL}/api/schedule/status`, { jobId: runningJob.id, status: 'Completed' })
            .then(() => fetchScheduledJobs())
            .catch(() => {});
          setIsCalling(false);
          return;
        }

        setSessionContacts(jobContacts);
        callQueueRef.current = contactsToCall.map(c => c.id).filter(id => id);
        
        addLog(`SCHEDULED PIPELINE: Starting "${runningJob.campaignTitle || 'Untitled'}"…`, "info");

        // Mark the job as 'Running-Acknowledge' on server
        axios.post(`${API_BASE_URL}/api/schedule/status`, { jobId: runningJob.id, status: 'Running-Acknowledge' })
          .catch(err => console.error("Failed to acknowledge job", err));

        // Start the manual pipeline
        if (apiKey) {
          dispatchNextBatch(apiKey, runningJob.agentId);
        }
      } catch (err) {
        console.error("Crash in job monitoring effect:", err);
        setIsCalling(false);
      }
    }
  }, [scheduledJobs, isCalling, apiKey, dispatchNextBatch, addLog, setAgentId]);

  useEffect(() => {
    if (activeView === "responses" && responseTab === "" && contacts.length > 0) {
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

  // --- MANUAL REFRESH: Force re-fetch contacts from DB (for diagnostic panel) ---
  const refreshContacts = useCallback(async () => {
    if (!user || !user.userId) return { success: false, error: 'No user' };
    const diagnostics = { steps: [], errors: [] };
    
    try {
      // Step 1: Get contacts with execution IDs that need syncing
      diagnostics.steps.push('Fetching contacts from DB...');
      const contactsRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
      const dbContacts = contactsRes.data || [];
      diagnostics.steps.push(`Found ${dbContacts.length} contacts in DB`);
      
      // Step 2: Find contacts with execution IDs but no lead_category
      const needSync = dbContacts.filter(c => c.executionId && (c.status === 'called' || c.status === 'completed') && !c.leadCategory);
      diagnostics.steps.push(`${needSync.length} contacts need AI sync`);
      
      // Step 3: Trigger backend pipeline for unsynced contacts
      if (needSync.length > 0) {
        const execIds = needSync.map(c => c.executionId).filter(Boolean);
        diagnostics.steps.push(`Triggering backend pipeline for ${execIds.length} execution(s)...`);
        
        try {
          const syncRes = await axios.post(`${API_BASE_URL}/api/sync-outbound/${user.userId}`, { executionIds: execIds });
          const syncData = syncRes.data;
          diagnostics.steps.push(`Backend processed ${syncData.processed || 0} execution(s)`);
          // Show per-execution results
          if (syncData.results && Array.isArray(syncData.results)) {
            for (const r of syncData.results) {
              if (r.success && r.result && typeof r.result === 'object') {
                diagnostics.steps.push(`  → ${r.executionId.slice(0,8)}… status="${r.result.status}" category="${r.result.category}" connected=${r.result.isConnected}`);
              } else if (r.success) {
                diagnostics.steps.push(`  → ${r.executionId.slice(0,8)}… processed OK`);
              } else {
                diagnostics.errors.push(`  → ${r.executionId.slice(0,8)}… FAILED: ${r.error}`);
              }
            }
          }
        } catch (syncErr) {
          diagnostics.errors.push(`Backend sync failed: ${syncErr.response?.data?.error || syncErr.message}`);
        }
        
        // Wait for backend to process
        diagnostics.steps.push('Waiting 4s for backend to process...');
        await new Promise(r => setTimeout(r, 4000));
      }
      
      // Step 4: Re-fetch from DB
      diagnostics.steps.push('Re-fetching contacts from DB...');
      const refreshRes = await axios.get(`${API_BASE_URL}/api/contacts/${user.userId}`);
      const refreshedContacts = refreshRes.data || [];
      
      const withCategories = refreshedContacts.filter(c => c.leadCategory);
      diagnostics.steps.push(`After sync: ${withCategories.length}/${refreshedContacts.length} contacts have AI categories`);
      
      // Step 5: Update state
      if (refreshedContacts.length > 0) {
        const defaultAgentId = agentId || '';
        const mappedContacts = refreshedContacts.map(c => {
          let aId = defaultAgentId;
          let aName = defaultAgentId.split('::')[0];
          if (c.id && c.id.includes('::')) {
            const parts = c.id.split('::');
            if (parts.length >= 3) { aId = `${parts[0]}::${parts[1]}`; aName = parts[0]; }
            else if (parts.length === 2) { aId = parts[0]; aName = parts[0]; }
          }
          return { ...c, agentId: aId, agentName: aName };
        });
        setContacts(mappedContacts);
        contactsRef.current = mappedContacts;
        diagnostics.steps.push('✓ Contacts state updated');
      }
      
      // Step 6: Refresh credits
      const creditRes = await axios.get(`${API_BASE_URL}/api/user-credits/${user.userId}`);
      if (creditRes.data.credits !== undefined) {
        setCredits(creditRes.data.credits);
        diagnostics.steps.push(`✓ Credits refreshed: ${creditRes.data.credits}`);
      }

      // Step 7: Refresh campaigns
      try {
        const campRes = await axios.get(`${API_BASE_URL}/api/campaigns/list/${user.userId}`);
        if (campRes.data.success) {
          setCampaigns(campRes.data.campaigns);
          diagnostics.steps.push(`✓ Campaigns refreshed: ${campRes.data.campaigns.length}`);
        }
      } catch (e) {
        diagnostics.errors.push(`Campaign refresh failed: ${e.message}`);
      }
      
      return { success: true, diagnostics };
    } catch (err) {
      diagnostics.errors.push(`Fatal: ${err.message}`);
      return { success: false, diagnostics };
    }
  }, [user, agentId]);

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
    stats: { total, done, active, failed, pct },
    credits,
    scheduledJobs,
    campaigns,
    deleteScheduledJob,
    fetchScheduledJobs,
    callStartTime,
    addCustomAgent,
    retryCalls,
    inboundCalls,
    refreshInbound: () => {
      if (user && user.userId) {
        setIsLoadingInbound(true);
        axios.post(`${API_BASE_URL}/api/inbound-calls/sync/${user.userId}`)
          .then(res => {
            if (res.data.success) {
              setInboundCalls(res.data.calls || []);
            }
            setIsLoadingInbound(false);
          })
          .catch(err => {
            console.error('Inbound sync failed:', err);
            // Fallback: try to get stored calls
            axios.get(`${API_BASE_URL}/api/inbound-calls/${user.userId}`)
              .then(res => {
                if (res.data.success) setInboundCalls(res.data.calls || []);
              })
              .catch(() => {});
            setIsLoadingInbound(false);
          });
      }
    },
    isLoadingInbound,
    refreshContacts
  };
}
