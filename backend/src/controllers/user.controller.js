const supabase = require('../services/supabase.service');
const { mapUser, mapContact } = require('../utils/mapper');

const getUserConfig = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase.from('users').select('*').eq('user_id', userId).single();
    if (error) throw error;
    res.json(mapUser(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUserConfig = async (req, res) => {
  const { userId } = req.params;
  const updates = req.body;
  const dbUpdates = {};
  if (updates.bolnaApiKey) dbUpdates.bolna_api_key = updates.bolnaApiKey;
  if (updates.bolnaAgentId) dbUpdates.bolna_agent_id = updates.bolnaAgentId;
  if (updates.isFirstLogin !== undefined) dbUpdates.is_first_login = updates.isFirstLogin;
  
  try {
    const { data, error } = await supabase.from('users').update(dbUpdates).eq('user_id', userId).select().single();
    if (error) throw error;
    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getContacts = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data.map(mapContact));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const saveContacts = async (req, res) => {
  const { userId, contacts } = req.body;
  if (!contacts || !Array.isArray(contacts)) return res.status(400).json({ error: "Invalid data" });

  try {
    const dbContacts = contacts.map(c => ({
      id: c.id,
      user_id: userId,
      name: c.name,
      phone: c.phone,
      status: c.status || 'pending',
      agent_id: c.agentId,
      agent_name: c.agentName,
      execution_id: c.executionId,
      call_date: c.date || new Date().toISOString().split('T')[0]
    }));

    const { data, error } = await supabase.from('contacts').upsert(dbContacts).select();
    if (error) throw error;
    res.json({ success: true, count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserConfig,
  updateUserConfig,
  getContacts,
  saveContacts
};
