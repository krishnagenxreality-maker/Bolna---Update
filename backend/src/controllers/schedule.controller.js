const supabase = require('../services/supabase.service');
const { mapJob, mapCampaign } = require('../utils/mapper');

const getJobs = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase.from('scheduled_jobs').select('*').eq('user_id', userId).order('scheduled_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, jobs: data.map(mapJob) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createJob = async (req, res) => {
  const { userId, campaignTitle, agentId, agentName, contacts, scheduledAt, apiKey, status, sheetName } = req.body;
  try {
    const jobId = Math.random().toString(36).substr(2, 9);
    const newJob = {
      id: jobId,
      user_id: userId,
      campaign_title: campaignTitle,
      agent_id: agentId,
      agent_name: agentName,
      contacts: contacts,
      scheduled_at: scheduledAt,
      api_key: apiKey,
      status: status || 'Scheduled'
    };
    await supabase.from('scheduled_jobs').insert([newJob]);

    const newCampaign = {
      id: jobId,
      user_id: userId,
      campaign_title: campaignTitle,
      campaign_date: new Date(scheduledAt).toLocaleDateString(),
      uploaded_sheet_name: sheetName || 'N/A',
      total_calls: contacts.length,
      selected_agent: agentName,
      campaign_status: status || 'Scheduled'
    };
    await supabase.from('campaigns').insert([newCampaign]);

    res.json({ success: true, jobId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getCampaigns = async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase.from('campaigns').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, campaigns: data.map(mapCampaign) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    await supabase.from('scheduled_jobs').delete().eq('id', id);
    await supabase.from('campaigns').delete().eq('id', id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getJobs,
  createJob,
  getCampaigns,
  deleteJob
};
