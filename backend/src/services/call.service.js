const supabase = require('./supabase.service');
const bolna = require('./bolna.service');
const deepseek = require('./deepseek.service');
const credit = require('./credit.service');

/**
 * Unified pipeline for processing call completion (Outbound and Inbound)
 */
const processCallCompletion = async (executionId, userId, direction = 'outbound') => {
  console.log(`\n [PIPELINE] Processing ${direction} call: ${executionId} (User: ${userId})`);

  try {
    // 1. Fetch User API Key
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('bolna_api_key')
      .eq('user_id', userId)
      .single();

    if (userError || !user?.bolna_api_key) {
      console.error(` [PIPELINE] Aborted: No Bolna API Key found for user ${userId}`);
      return;
    }

    // 2. Fetch Latest Call Data from Bolna
    const bolnaData = await bolna.getExecutionStatus(user.bolna_api_key, executionId);
    if (!bolnaData) {
      console.warn(` [PIPELINE] Aborted: Could not fetch execution details from Bolna`);
      return;
    }

    const summary = bolnaData.summary || bolnaData.call_summary || '';
    const transcript = bolnaData.transcript || bolnaData.call_transcript || '';
    const recordingUrl = bolnaData.telephony_data?.recording_url || bolnaData.recording_url || '';
    const status = (bolnaData.status || '').toLowerCase();
    const duration = bolnaData.duration || 0;
    
    console.log(` [PIPELINE] Status: ${status}, Summary Length: ${summary.length}`);

    // 3. AI Analysis via DeepSeek
    let category = 'Uncategorized';
    if (summary && summary.length > 10) {
      category = await deepseek.analyzeSummary(summary);
    }

    // 4. Persistence - Update Database Idempotently
    
    // A. Update Contacts/CallDetails (Mainly for Outbound tracking)
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
    
    if (contactError) console.error(' [PIPELINE] Contacts Update Error:', contactError.message);

    // B. Upsert into Responses Table (Source of truth for Responses Page)
    const responseRecord = {
      execution_id: executionId,
      user_id: userId,
      phone: bolnaData.telephony_data?.recipient_phone_number || bolnaData.telephony_data?.caller_id || '',
      status: status,
      summary: summary,
      transcript: transcript,
      category: category,
      date: new Date().toISOString().split('T')[0]
    };

    const { error: resError } = await supabase.from('responses').upsert(responseRecord, { onConflict: 'execution_id' });
    if (resError) console.error(' [PIPELINE] Responses Upsert Error:', resError.message);

    // C. Lead Generation Logic
    const interestedKeywords = ['Interested', 'Appointment', 'Booking', 'Inquiry', 'Positive'];
    const isLeadCandidate = interestedKeywords.some(kw => category.toLowerCase().includes(kw.toLowerCase()));
    
    if (isLeadCandidate || status === 'completed') {
      const leadRecord = {
        execution_id: executionId,
        user_id: userId,
        name: bolnaData.recipient_name || bolnaData.caller_name || 'Anonymous',
        phone: responseRecord.phone,
        category: category,
        summary: summary,
        recording_url: recordingUrl,
        date: responseRecord.date,
        lead_source: direction
      };
      
      const { error: leadError } = await supabase.from('leads').upsert(leadRecord, { onConflict: 'execution_id' });
      if (leadError) console.error(' [PIPELINE] Leads Upsert Error:', leadError.message);
    }

    // D. Inbound Tracking (Specialized table)
    if (direction === 'inbound') {
      const inboundRecord = {
        execution_id: executionId,
        user_id: userId,
        caller_name: bolnaData.caller_name || 'Anonymous',
        caller_phone: responseRecord.phone,
        agent_name: bolnaData.agent_name || 'Inbound Agent',
        agent_id: bolnaData.agent_id,
        call_date: new Date().toISOString(),
        summary: summary,
        transcript: transcript,
        recording_url: recordingUrl,
        reason: category,
        status: status
      };
      await supabase.from('inbound_calls').upsert(inboundRecord, { onConflict: 'execution_id' });
    }

    // 5. Credit Deduction (Only once per execution)
    // We check if it was connected first.
    const wasConnected = ['completed', 'busy', 'no answer', 'no_answer', 'call disconnected', 'call_disconnected'].includes(status);
    if (wasConnected) {
      await credit.deductCredit(userId);
    }

    console.log(` [PIPELINE] Successfully processed execution: ${executionId}\n`);
  } catch (err) {
    console.error(` [PIPELINE] Critical Failure for ${executionId}:`, err.message);
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
    const agentId = job.agent_id.includes('::') ? job.agent_id.split('::')[1] : job.agent_id;
    
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
