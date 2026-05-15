const BOLNA_API_URL = "https://api.bolna.ai";

/**
 * Trigger an outbound call via Bolna API
 */
const makeCall = async (apiKey, agentId, recipientPhone, recipientName) => {
  if (!apiKey || !agentId || !recipientPhone) {
    throw new Error('Missing mandatory Bolna parameters (API Key, AgentID, or Phone)');
  }

  console.log(` [BOLNA] Triggering call to ${recipientPhone} (Agent: ${agentId})...`);

  const payload = {
    recipient_phone_number: recipientPhone,
    recipient_name: recipientName || "User",
    user_id: "system"
  };

  try {
    const res = await fetch(`${BOLNA_API_URL}/agent/${agentId}/call`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const executionId = data.execution_id || data.id;
    console.log(` [BOLNA] Success! Execution ID: ${executionId}`);
    return executionId;
  } catch (err) {
    console.error(` [BOLNA] Call Dispatch Failed:`, err.message);
    throw err;
  }
};

/**
 * Fetch execution status and details
 */
const getExecutionStatus = async (apiKey, executionId) => {
  if (!apiKey || !executionId) return null;

  try {
    const res = await fetch(`${BOLNA_API_URL}/execution/${executionId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) {
      console.warn(` [BOLNA] Status fetch failed for ${executionId}: ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(` [BOLNA] Status Fetch Error:`, err.message);
    return null;
  }
};

/**
 * Fetch inbound calls for an agent
 */
const getInboundCalls = async (apiKey, agentId) => {
  if (!apiKey || !agentId) return [];

  try {
    const res = await fetch(`${BOLNA_API_URL}/agent/${agentId}/executions?call_type=inbound`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error(` [BOLNA] Inbound Fetch Error:`, err.message);
    return [];
  }
};

module.exports = {
  makeCall,
  getExecutionStatus,
  getInboundCalls
};
