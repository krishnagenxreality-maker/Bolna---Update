const supabase = require('../services/supabase.service');

const getDemoRequests = async (req, res) => {
  try {
    const { data, error } = await supabase.from('demo_requests').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const submitDemoRequest = async (req, res) => {
  const r = req.body;
  const demoToInsert = {
    full_name: r.fullName,
    company: r.company,
    email: r.email,
    phone: r.phone,
    website: r.website || '',
    business_type: r.businessType || 'Other',
    use_cases: r.useCases || [],
    call_volume: r.callVolume || 'Unknown',
    current_process: r.currentProcess || 'Other',
    demo_date: r.demoDate || '',
    demo_time: r.demoTime || '',
    status: 'Pending'
  };
  try {
    const { data, error } = await supabase.from('demo_requests').insert([demoToInsert]).select().single();
    if (error) throw error;
    res.json({ success: true, request: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getDemoRequests,
  submitDemoRequest
};
