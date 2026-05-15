const callService = require('../services/call.service');
const supabase = require('../services/supabase.service');

/**
 * Production Webhook Handler for Bolna
 * This endpoint receives real-time call status updates from Bolna.
 */
const handleBolnaWebhook = async (req, res) => {
  const payload = req.body;
  const executionId = payload.execution_id || payload.id;
  
  console.log(`\n [WEBHOOK] ==============================`);
  console.log(` [WEBHOOK] Event: ${payload.event || 'status_update'}`);
  console.log(` [WEBHOOK] Execution: ${executionId}`);
  console.log(` [WEBHOOK] Status: ${payload.status || 'unknown'}`);
  console.log(` [WEBHOOK] Direction: ${payload.call_direction || 'unknown'}`);
  console.log(` [WEBHOOK] ==============================`);

  if (!executionId) {
    return res.status(400).json({ error: 'Missing execution_id in payload' });
  }

  try {
    // 1. Resolve User Identity
    let userId = payload.user_id;
    
    // If not provided in payload, look up from contacts
    if (!userId || userId === 'system' || userId === 'undefined') {
      const { data: contact } = await supabase
        .from('contacts')
        .select('user_id')
        .eq('execution_id', executionId)
        .single();
      
      if (contact) {
        userId = contact.user_id;
        console.log(` [WEBHOOK] Resolved userId from contacts: ${userId}`);
      }
    }

    if (!userId || userId === 'undefined') {
      console.warn(` [WEBHOOK] Could not resolve userId for execution ${executionId}. Skipping.`);
      return res.status(200).json({ status: 'ignored', reason: 'unresolved_user' });
    }

    // 2. Determine if call is finished
    const status = (payload.status || '').toLowerCase();
    const isCompleted = ['completed', 'failed', 'no answer', 'busy', 'call disconnected', 'no_answer', 'call_disconnected'].includes(status);

    if (isCompleted || payload.event === 'call_completed') {
      console.log(` [WEBHOOK] Triggering processCallCompletion for user ${userId}...`);
      // Run async to avoid webhook timeout — Bolna expects fast 200
      callService.processCallCompletion(executionId, userId, payload.call_direction || 'outbound')
        .catch(err => console.error(` [WEBHOOK] Pipeline error:`, err.message));
    } else {
      console.log(` [WEBHOOK] Status "${status}" is not terminal, skipping pipeline.`);
    }

    res.status(200).json({ status: 'received', message: 'Pipeline triggered' });
  } catch (err) {
    console.error(' [WEBHOOK] Internal Error:', err.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  handleBolnaWebhook
};
