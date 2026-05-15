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
 * 4. Persist to: contacts, responses, leads
 * 5. Deduct credit (idempotent)
 */
const processCallCompletion = async (executionId, userId, direction = 'outbound') => {
  console.log(`\n========================================`);
  console.log(` [PIPELINE] START: ${executionId}`);
  console.log(` [PIPELINE] User: ${userId}, Direction: ${direction}`);
  console.log(`========================================`);

  try {
    // ── STEP 1: Fetch User API Key ──
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('bolna_api_key')
      .eq('user_id', userId)
      .single();

    if (userError || !user?.bolna_api_key) {
      console.error(` [PIPELINE] ABORT: No Bolna API Key for user ${userId}. Error:`, userError?.message);
      return;
    }
    console.log(` [PIPELINE] ✓ Step 1: User API key found`);

    // ── STEP 2: Fetch Call Data from Bolna ──
    const bolnaData = await bolna.getExecutionStatus(user.bolna_api_key, executionId);
    if (!bolnaData) {
      console.warn(` [PIPELINE] ABORT: Could not fetch execution details from Bolna for ${executionId}`);
      return;
    }

    const summary = bolnaData.summary || bolnaData.call_summary || '';
    const transcript = bolnaData.transcript || bolnaData.call_transcript || '';
    const recordingUrl = bolnaData.telephony_data?.recording_url || bolnaData.recording_url || '';
    const status = (bolnaData.status || '').toLowerCase();
    const duration = bolnaData.duration || 0;
    const phone = bolnaData.telephony_data?.recipient_phone_number || bolnaData.telephony_data?.caller_id || '';
    const contactName = bolnaData.recipient_name || bolnaData.caller_name || 'Anonymous';
    
    console.log(` [PIPELINE] ✓ Step 2: Bolna data fetched. Status: "${status}", Summary: ${summary.length} chars, Recording: ${recordingUrl ? 'YES' : 'NO'}`);

    // ── STEP 3: AI Analysis via DeepSeek (NON-BLOCKING) ──
    let category = 'Uncategorized';
    try {
      if (summary && summary.length > 10) {
        category = await deepseek.analyzeSummary(summary);
        console.log(` [PIPELINE] ✓ Step 3: DeepSeek category = "${category}"`);
      } else {
        console.log(` [PIPELINE] ⚠ Step 3: Summary too short (${summary.length} chars), skipping AI`);
      }
    } catch (deepseekErr) {
      console.error(` [PIPELINE] ⚠ Step 3: DeepSeek FAILED (non-blocking):`, deepseekErr.message);
      // Pipeline continues — category stays "Uncategorized"
    }

    // ── STEP 4A: Update Contacts table ──
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
      console.error(` [PIPELINE] ⚠ Step 4A: Contacts update failed:`, contactError.message);
    } else {
      console.log(` [PIPELINE] ✓ Step 4A: Contacts table updated`);
    }

    // ── STEP 4B: Upsert into Responses table ──
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

    const { error: resError } = await supabase.from('responses').upsert(responseRecord, { onConflict: 'execution_id' });
    if (resError) {
      console.error(` [PIPELINE] ⚠ Step 4B: Responses upsert failed:`, resError.message);
    } else {
      console.log(` [PIPELINE] ✓ Step 4B: Responses table updated`);
    }

    // ── STEP 4C: Lead Generation — ALL completed/connected calls get a lead ──
    const connectedStatuses = ['completed', 'busy', 'no answer', 'no_answer', 'call disconnected', 'call_disconnected'];
    const isConnected = connectedStatuses.includes(status);
    
    if (isConnected) {
      const leadRecord = {
        execution_id: executionId,
        user_id: userId,
        name: contactName,
        phone: phone,
        category: category,
        summary: summary,
        recording_url: recordingUrl,
        date: responseRecord.date,
        lead_source: direction
      };
      
      const { error: leadError } = await supabase.from('leads').upsert(leadRecord, { onConflict: 'execution_id' });
      if (leadError) {
        console.error(` [PIPELINE] ⚠ Step 4C: Leads upsert FAILED:`, leadError.message);
        console.error(` [PIPELINE]   → Lead record was:`, JSON.stringify(leadRecord));
      } else {
        console.log(` [PIPELINE] ✓ Step 4C: Lead saved — "${category}" for ${phone}`);
      }
    } else {
      console.log(` [PIPELINE] ⚠ Step 4C: Skipped lead (status "${status}" not connected)`);
    }

    // ── STEP 4D: Inbound Tracking ──
    if (direction === 'inbound') {
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
        console.error(` [PIPELINE] ⚠ Step 4D: Inbound upsert failed:`, inboundErr.message);
      } else {
        console.log(` [PIPELINE] ✓ Step 4D: Inbound call tracked`);
      }
    }

    // ── STEP 5: Credit Deduction ──
    if (isConnected) {
      const deducted = await credit.deductCredit(userId, executionId);
      if (deducted) {
        console.log(` [PIPELINE] ✓ Step 5: Credit deducted for ${userId}`);
      } else {
        console.log(` [PIPELINE] ⚠ Step 5: Credit NOT deducted (insufficient or already deducted)`);
      }
    } else {
      console.log(` [PIPELINE] ⚠ Step 5: No credit deduction (call not connected)`);
    }

    console.log(` [PIPELINE] ✅ COMPLETE: ${executionId}`);
    console.log(`========================================\n`);
  } catch (err) {
    console.error(`\n [PIPELINE] ❌ CRITICAL FAILURE for ${executionId}:`, err.message);
    console.error(err.stack);
  }
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
    await supabase.from('scheduled_jobs').update({ status: 'Running-Acknowledge' }).eq('id', jobId);
    await supabase.from('campaigns').update({ campaign_status: 'Running' }).eq('id', jobId);

    const contacts = Array.isArray(job.contacts) ? job.contacts : [];
    const rawAgentId = job.agent_id || '';
    const agentId = rawAgentId.includes('::') ? rawAgentId.split('::')[1] : rawAgentId;
    
    console.log(` [JOB] Dispatching ${contacts.length} calls via Agent ${agentId}...`);

    for (const contact of contacts) {
      try {
        const executionId = await bolna.makeCall(job.api_key, agentId, contact.phone, contact.name);
        
        // Update contact record with Bolna handle
        await supabase
          .from('contacts')
          .update({ execution_id: executionId, status: 'calling' })
          .eq('id', contact.id);
          
      } catch (err) {
        console.error(` [JOB] Contact failed (${contact.name}):`, err.message);
        await supabase.from('contacts').update({ status: 'failed', response: err.message }).eq('id', contact.id);
      }
      
      // Delay to avoid overwhelming API limits
      await new Promise(r => setTimeout(r, 700));
    }

    await supabase.from('scheduled_jobs').update({ status: 'Completed' }).eq('id', jobId);
    await supabase.from('campaigns').update({ campaign_status: 'Completed' }).eq('id', jobId);

    console.log(` [JOB] Finished Job: ${jobId}\n`);
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
