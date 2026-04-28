export async function makeCall(key, agId, phone) {
  const res = await fetch("https://api.bolna.ai/call", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ agent_id: agId, recipient_phone_number: phone })
  });
  if (!res.ok) { 
    const txt = await res.text(); 
    throw new Error(`HTTP ${res.status}: ${txt.slice(0,100)}`); 
  }
  const data = await res.json();
  if (!data.execution_id) throw new Error("No execution_id returned");
  return data.execution_id;
}

export async function fetchExecutionStatus(key, executionId) {
  const res = await fetch(`https://api.bolna.ai/executions/${executionId}`, {
    headers: { "Authorization": `Bearer ${key}` }
  });
  if (!res.ok) return null;
  return await res.json();
}

export async function analyzeSummaryWithDeepSeek(apiKey, summary) {
  if (!summary) return "not_interested";

  try {
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a call analysis assistant. Analyze the summary and classify it into one of these categories: interested, not_interested, reschedule. Return ONLY the single word category."
          },
          {
            role: "user",
            content: `Summary: ${summary}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) return "not_interested";
    const data = await res.json();
    const result = data.choices[0].message.content.toLowerCase().trim();
    
    if (result.includes("not_interested") || result.includes("not interested")) return "not_interested";
    if (result.includes("interested")) return "interested";
    if (result.includes("reschedule")) return "reschedule";
    
    return "not_interested";
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return "not_interested";
  }
}
