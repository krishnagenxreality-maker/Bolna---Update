const supabase = require('./supabase.service');
const bolna = require('./bolna.service');
const deepseek = require('./deepseek.service');
const credit = require('./credit.service');

/**
 * Unified pipeline for processing call completion (Outbound and Inbound)
 * This is the SINGLE source of truth for post-call data persistence.
 * 
 * Pipeline Steps:
 * 1. Fetch user API key
 * 2. Fetch call data from Bolna
 * 3. AI categorization via DeepSeek (non-blocking)
 * 4A. Update contacts table
 * 4B. Upsert responses table
 * 4C. Upsert leads table
 * 4D. Inbound call tracking
 * 5. Credit deduction
 * 6. Campaign stats update
 * 
 * CRITICAL: Each step is independently try/caught.
 * One step failing MUST NOT stop later steps.
 */
const processCallCompletion = async (executionId, userId, direction = 'outbound') => {
  console.log(`\n========================================`);
  console.log(` [PIPELINE] START processCallCompletion`);
  console.log(` [PIPELINE] executionId: ${executionId}`);
  console.log(` [PIPELINE] userId: ${userId}`);
  console.log(` [PIPELINE] direction: ${direction}`);
  console.log(`========================================`);

  // Shared state across steps
  let apiKey = null;
  let summary = '';
  let transcript = '';
  let recordingUrl = '';
  let status = '';
  let duration = 0;
  let phone = '';
  let contactName = 'Anonymous';
  let category = 'Uncategorized';
  let isConnected = false;
  let bolnaData = null;

  // ── STEP 1: Fetch User API Key ──
  try {
    console.log(` [PIPELINE] STEP 1: Fetching user API key...`);
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('bolna_api_key')
      .eq('user_id', userId)
      .single();

    if (userError || !user?.bolna_api_key) {
      console.error(` [PIPELINE] STEP 1 FAILED: No Bolna API Key for user ${userId}. Error:`, userError?.message);
      console.log(` [PIPELINE] ABORT — Cannot proceed without API key`);
      return;
    }
    apiKey = user.bolna_api_key;
    console.log(` [PIPELINE] ✓ STEP 1: User API key found`);
  } catch (err) {
    console.error(` [PIPELINE] STEP 1 FAILED:`, err.message);
    return; // Can't continue without API key
  }

  // ── STEP 2: Fetch Call Data from Bolna ──
  try {
    console.log(` [PIPELINE] STEP 2: Fetching Bolna execution data...`);
    bolnaData = await bolna.getExecutionStatus(apiKey, executionId);
    if (!bolnaData) {
      console.warn(` [PIPELINE] STEP 2 FAILED: Could not fetch execution details from Bolna for ${executionId}`);
      console.log(` [PIPELINE] ABORT — Cannot proceed without call data`);
      return;
    }

    summary = bolnaData.summary || bolnaData.call_summary || '';
    transcript = bolnaData.transcript || bolnaData.call_transcript || '';
    recordingUrl = bolnaData.telephony_data?.recording_url || bolnaData.recording_url || '';
    status = (bolnaData.status || '').toLowerCase();
    duration = bolnaData.duration || 0;
    phone = bolnaData.telephony_data?.recipient_phone_number || bolnaData.telephony_data?.caller_id || '';
    contactName = bolnaData.recipient_name || bolnaData.caller_name || 'Anonymous';
    
    const connectedStatuses = ['completed', 'busy', 'no answer', 'no_answer', 'call disconnected', 'call_disconnected'];
    isConnected = connectedStatuses.includes(status);
    
    console.log(` [PIPELINE] ✓ STEP 2: Bolna data fetched`);
    console.log(`   Status: "${status}", Connected: ${isConnected}`);
    console.log(`   Summary: ${summary.length} chars, Recording: ${recordingUrl ? 'YES' : 'NO'}`);
  } catch (err) {
    console.error(` [PIPELINE] STEP 2 FAILED:`, err.message);
    return; // Can't continue without call data
  }

  // ── STEP 3: AI Analysis via DeepSeek (NON-BLOCKING) ──
  try {
    console.log(` [PIPELINE] STEP 3: DeepSeek AI categorization...`);
    if (summary && summary.length > 10) {
      console.log(` [PIPELINE] DeepSeek request payload:`, { summary: summary.substring(0, 200) });
      category = await deepseek.analyzeSummary(summary);
      if (!category || category.trim() === '') {
        category = 'Uncategorized';
      }
      console.log(` [PIPELINE] DeepSeek response category: "${category}"`);
      console.log(` [PIPELINE] ✓ STEP 3: DeepSeek category = "${category}"`);
    } else {
      console.log(` [PIPELINE] ⚠ STEP 3: Summary too short (${summary.length} chars), defaulting to "Uncategorized"`);
    }
  } catch (deepseekErr) {
    console.error(` [PIPELINE] STEP 3 FAILED (non-blocking):`, deepseekErr.message);
    category = 'Uncategorized';
    // Pipeline continues
  }

  // ── STEP 4A: Update Contacts table ──
  try {
    console.log(` [PIPELINE] STEP 4A: Updating contacts table...`);
    const { error: contactError } = await supabase
      .from('contacts')
      .update({
        status: status === 'completed' ? 'called' : status,
        response: status,
        summary: summary,
        lead_category: category,
        recording_url: recordingUrl,
        duration: duration,
        call_date: new Date().toISOString().split('T')[0]
      })
      .eq('execution_id', executionId);
    
    if (contactError) {
      console.error(` [PIPELINE] STEP 4A FAILED:`, contactError.message);
    } else {
      console.log(` [PIPELINE] ✓ STEP 4A: Contacts table updated`);
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 4A FAILED:`, err.message);
  }

  // ── STEP 4B: Upsert into Responses table ──
  try {
    console.log(` [PIPELINE] STEP 4B: Upserting responses table...`);
    const responseRecord = {
      execution_id: executionId,
      user_id: userId,
      phone: phone,
      status: status,
      summary: summary,
      transcript: transcript,
      category: category,
      date: new Date().toISOString().split('T')[0]
    };
    console.log(` [PIPELINE] Response record:`, JSON.stringify(responseRecord));

    const { error: resError } = await supabase.from('responses').upsert(responseRecord, { onConflict: 'execution_id' });
    if (resError) {
      console.error(` [PIPELINE] STEP 4B FAILED:`, resError.message);
    } else {
      console.log(` [PIPELINE] ✓ STEP 4B: Responses table updated`);
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 4B FAILED:`, err.message);
  }

  // ── STEP 4C: Lead Generation — ALL completed/connected calls get a lead ──
  try {
    console.log(` [PIPELINE] STEP 4C: Lead generation (isConnected: ${isConnected})...`);
    if (isConnected) {
      const leadRecord = {
        execution_id: executionId,
        user_id: userId,
        name: contactName,
        phone: phone,
        category: category,
        summary: summary,
        recording_url: recordingUrl,
        date: new Date().toISOString().split('T')[0],
        lead_source: direction
      };
      console.log(` [PIPELINE] Lead record:`, JSON.stringify(leadRecord));
      
      const { error: leadError } = await supabase.from('leads').upsert(leadRecord, { onConflict: 'execution_id' });
      if (leadError) {
        console.error(` [PIPELINE] STEP 4C FAILED:`, leadError.message);
        console.error(` [PIPELINE]   → Lead record was:`, JSON.stringify(leadRecord));
      } else {
        console.log(` [PIPELINE] ✓ STEP 4C: Lead saved — "${category}" for ${phone}`);
      }
    } else {
      console.log(` [PIPELINE] ⚠ STEP 4C: Skipped lead (status "${status}" not connected)`);
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 4C FAILED:`, err.message);
  }

  // ── STEP 4D: Inbound Tracking ──
  try {
    if (direction === 'inbound') {
      console.log(` [PIPELINE] STEP 4D: Inbound call tracking...`);
      const inboundRecord = {
        execution_id: executionId,
        user_id: userId,
        caller_name: contactName,
        caller_phone: phone,
        agent_name: bolnaData.agent_name || 'Inbound Agent',
        agent_id: bolnaData.agent_id,
        call_date: new Date().toISOString(),
        summary: summary,
        transcript: transcript,
        recording_url: recordingUrl,
        reason: category,
        status: status
      };
      const { error: inboundErr } = await supabase.from('inbound_calls').upsert(inboundRecord, { onConflict: 'execution_id' });
      if (inboundErr) {
        console.error(` [PIPELINE] STEP 4D FAILED:`, inboundErr.message);
      } else {
        console.log(` [PIPELINE] ✓ STEP 4D: Inbound call tracked`);
      }
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 4D FAILED:`, err.message);
  }

  // ── STEP 5: Credit Deduction ──
  try {
    console.log(` [PIPELINE] STEP 5: Credit deduction (isConnected: ${isConnected})...`);
    if (isConnected) {
      const deducted = await credit.deductCredit(userId, executionId);
      if (deducted) {
        console.log(` [PIPELINE] ✓ STEP 5: Credit deducted for ${userId}`);
      } else {
        console.log(` [PIPELINE] ⚠ STEP 5: Credit NOT deducted (insufficient or already deducted)`);
      }
    } else {
      console.log(` [PIPELINE] ⚠ STEP 5: No credit deduction (call not connected)`);
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 5 FAILED:`, err.message);
  }

  // ── STEP 6: Campaign Stats Update ──
  try {
    console.log(` [PIPELINE] STEP 6: Campaign stats update...`);
    // Find the campaign this execution belongs to via contacts table
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, agent_id')
      .eq('execution_id', executionId)
      .single();

    if (contact && isConnected) {
      // The contact ID contains the campaign/job ID pattern: "agentLabel::agentId::timestamp-index-hash"
      // The campaign ID is the scheduled_job ID which created the contacts
      // We find the campaign by looking up which scheduled_job has this contact
      const { data: jobs } = await supabase
        .from('scheduled_jobs')
        .select('id, contacts')
        .eq('user_id', userId);

      if (jobs) {
        for (const job of jobs) {
          const jobContacts = Array.isArray(job.contacts) ? job.contacts : [];
          const found = jobContacts.some(jc => jc.id === contact.id);
          if (found) {
            // Increment credits_used on the campaign
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('credits_used')
              .eq('id', job.id)
              .single();

            if (campaign) {
              await supabase
                .from('campaigns')
                .update({ 
                  credits_used: (campaign.credits_used || 0) + 1,
                  updated_at: new Date().toISOString()
                })
                .eq('id', job.id);
              console.log(` [PIPELINE] ✓ STEP 6: Campaign ${job.id} credits_used incremented`);
            }
            break;
          }
        }
      }
    } else {
      console.log(` [PIPELINE] ⚠ STEP 6: No campaign update needed (no contact or not connected)`);
    }
  } catch (err) {
    console.error(` [PIPELINE] STEP 6 FAILED (non-blocking):`, err.message);
  }

  console.log(` [PIPELINE] ✅ DONE: ${executionId}`);
  console.log(`========================================\n`);
  
  return { 
    executionId, 
    status, 
    category, 
    isConnected,
    hasSummary: summary.length > 0, 
    hasRecording: !!recordingUrl 
  };
};

/**
 * Execute a batch of calls for a scheduled job
 */
const executeJob = async (jobId) => {
  console.log(`\n [JOB] Executing Job: ${jobId}`);
  
  try {
    const { data: job, error: jobError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) throw new Error('Job not found in database');

    // Prevent race conditions
    await supabase.from('scheduled_jobs').update({ status: 'Running' }).eq('id', jobId);
    await supabase.from('campaigns').update({ campaign_status: 'Running' }).eq('id', jobId);

    const contacts = Array.isArray(job.contacts) ? job.contacts : [];
    const rawAgentId = job.agent_id || '';
    const agentId = rawAgentId.includes('::') ? rawAgentId.split('::')[1] : rawAgentId;
    
    console.log(` [JOB] Dispatching ${contacts.length} calls via Agent ${agentId}...`);

    let successCount = 0;
    let failCount = 0;

    for (const contact of contacts) {
      try {
        const executionId = await bolna.makeCall(job.api_key, agentId, contact.phone, contact.name);
        
        // Update contact record with Bolna handle
        await supabase
          .from('contacts')
          .update({ execution_id: executionId, status: 'calling' })
          .eq('id', contact.id);
        
        successCount++;
      } catch (err) {
        console.error(` [JOB] Contact failed (${contact.name}):`, err.message);
        await supabase.from('contacts').update({ status: 'failed', response: err.message }).eq('id', contact.id);
        failCount++;
      }
      
      // Delay to avoid overwhelming API limits
      await new Promise(r => setTimeout(r, 700));
    }

    // Always mark as completed when all calls dispatched (regardless of individual failures)
    await supabase.from('scheduled_jobs').update({ status: 'Completed' }).eq('id', jobId);
    await supabase.from('campaigns').update({ campaign_status: 'Completed' }).eq('id', jobId);

    console.log(` [JOB] Finished Job: ${jobId} (${successCount} success, ${failCount} failed)\n`);
  } catch (err) {
    console.error(` [JOB] Failed:`, err.message);
    await supabase.from('scheduled_jobs').update({ status: 'Failed' }).eq('id', jobId);
    await supabase.from('campaigns').update({ campaign_status: 'Failed' }).eq('id', jobId);
  }
};

module.exports = {
  processCallCompletion,
  executeJob
};
