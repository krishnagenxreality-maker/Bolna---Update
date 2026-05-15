/**
 * Production Mapper Utility
 * Ensures consistent data structure between DB (snake_case) and API (camelCase)
 */

const mapUser = (user) => {
  if (!user) return null;
  return {
    userId: user.user_id,
    organization: user.organization || "",
    email: user.email || "",
    role: user.role || "user",
    userType: user.user_type || "regular",
    bolnaApiKey: user.bolna_api_key,
    bolnaAgentId: user.bolna_agent_id,
    totalCredits: user.total_credits || 0,
    usedCredits: user.used_credits || 0,
    remainingCredits: user.remaining_credits !== undefined ? user.remaining_credits : (user.credits || 0),
    credits: user.remaining_credits !== undefined ? user.remaining_credits : (user.credits || 0),
    isFirstLogin: user.is_first_login,
    deviceSession: user.device_session,
    activeSessions: user.active_sessions || 0,
    reportUsageWeekly: user.report_usage_weekly || 0,
    reportUsageMonthly: user.report_usage_monthly || 0,
    createdAt: user.created_at
  };
};

const mapContact = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    userId: c.user_id,
    name: c.name,
    phone: c.phone,
    status: c.status || 'pending',
    response: c.response,
    summary: c.summary,
    leadCategory: c.lead_category,
    executionId: c.execution_id,
    date: c.call_date,
    recordingUrl: c.recording_url,
    direction: c.call_direction,
    agentId: c.agent_id,
    agentName: c.agent_name,
    duration: c.duration,
    createdAt: c.created_at
  };
};

const mapResponse = (r) => {
  if (!r) return null;
  return {
    executionId: r.execution_id,
    userId: r.user_id,
    phone: r.phone,
    status: r.status,
    summary: r.summary,
    transcript: r.transcript,
    category: r.category,
    credits: r.credits,
    date: r.date,
    createdAt: r.created_at
  };
};

const mapLead = (l) => {
  if (!l) return null;
  return {
    executionId: l.execution_id,
    userId: l.user_id,
    name: l.name,
    phone: l.phone,
    category: l.category,
    summary: l.summary,
    recordingUrl: l.recording_url,
    date: l.date,
    source: l.lead_source,
    createdAt: l.created_at
  };
};

const mapCampaign = (c) => {
  if (!c) return null;
  return {
    id: c.id,
    userId: c.user_id,
    title: c.campaign_title,
    date: c.campaign_date,
    sheetName: c.uploaded_sheet_name,
    totalCalls: c.total_calls,
    agentName: c.selected_agent,
    status: c.campaign_status,
    creditsUsed: c.credits_used,
    createdAt: c.created_at
  };
};

const mapJob = (j) => {
  if (!j) return null;
  return {
    id: j.id,
    userId: j.user_id,
    title: j.campaign_title,
    campaignTitle: j.campaign_title,
    agentId: j.agent_id,
    agentName: j.agent_name,
    contacts: j.contacts,
    scheduledAt: j.scheduled_at,
    status: j.status,
    createdAt: j.created_at
  };
};

module.exports = {
  mapUser,
  mapContact,
  mapResponse,
  mapLead,
  mapCampaign,
  mapJob
};
