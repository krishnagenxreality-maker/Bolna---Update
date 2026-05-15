const supabase = require('../services/supabase.service');

const getAgents = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase.from('custom_agents').select('*').eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true, agents: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createAgent = async (req, res) => {
  const { userId, agentName, script, scriptType, bolnaAgentId, voiceId, voiceName } = req.body;
  try {
    const newAgent = {
      user_id: userId,
      agent_name: agentName,
      script,
      script_type: scriptType,
      bolna_agent_id: bolnaAgentId,
      voice_id: voiceId,
      voice_name: voiceName
    };
    const { data, error } = await supabase.from('custom_agents').insert([newAgent]).select().single();
    if (error) throw error;
    res.json({ success: true, agent: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAgents,
  createAgent
};
