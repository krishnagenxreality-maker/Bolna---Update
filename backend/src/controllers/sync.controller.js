const callService = require('../services/call.service');
const bolna = require('../services/bolna.service');
const supabase = require('../services/supabase.service');

const syncInbound = async (req, res) => {
  const { userId } = req.params;
  console.log(` [SYNC] Syncing inbound calls for ${userId}...`);

  try {
    const { data: user } = await supabase.from('users').select('bolna_api_key, bolna_agent_id').eq('user_id', userId).single();
    if (!user?.bolna_api_key) return res.status(400).json({ error: 'No API Key' });

    // Inbound Logic
    const agentId = user.bolna_agent_id?.includes('::') ? user.bolna_agent_id.split('::')[1] : user.bolna_agent_id;
    if (!agentId) return res.status(400).json({ error: 'No Agent ID' });

    const calls = await bolna.getInboundCalls(user.bolna_api_key, agentId);
    for (const call of calls) {
      await callService.processCallCompletion(call.execution_id || call.id, userId, 'inbound');
    }

    const { data: stored } = await supabase.from('inbound_calls').select('*').eq('user_id', userId).order('call_date', { ascending: false });
    res.json({ success: true, calls: stored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const syncOutbound = async (req, res) => {
  const { userId } = req.params;
  const { executionIds } = req.body;
  try {
    for (const id of executionIds || []) {
      await callService.processCallCompletion(id, userId, 'outbound');
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  syncInbound,
  syncOutbound
};
