const { randomUUID } = require('crypto');
const supabase = require('../services/supabase.service');

const getAllRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const submitRequest = async (req, res) => {
  const r = req.body;
  const requestToInsert = {
    id: randomUUID(),
    name: r.name,
    organization_name: r.organizationName,
    email: r.email,
    credits_selected: r.creditsSelected,
    purpose: r.purpose || '',
    call_purpose: r.callPurpose || '',
    script_content: r.scriptContent || '',
    purpose_type: r.purposeType || 'regular',
    status: 'Pending'
  };
  try {
    const { data, error } = await supabase.from('requests').insert([requestToInsert]).select().single();
    if (error) throw error;
    res.json({ success: true, request: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('requests').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllRequests,
  submitRequest,
  deleteRequest
};
