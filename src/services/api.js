export async function makeCall(key, agId, phone, name = "") {
  const res = await fetch("https://api.bolna.ai/call", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      agent_id: agId, 
      recipient_phone_number: phone,
      callback_url: (import.meta.env.VITE_CALLBACK_URL || (window.location.origin + "/api/webhook/bolna")),
      user_variables: {
        customer_name: name || "Hello",
        name: name || "Hello",
        "{name}": name || "Hello",
        "{{name}}": name || "Hello"
      }
    })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt.slice(0, 100)}`);
  }
  const data = await res.json();
  if (!data.execution_id) throw new Error("No execution_id returned");
  return data.execution_id;
}

export async function fetchVoices(key) {
  if (!key) return [];
  try {
    const res = await fetch("https://api.bolna.ai/voices", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (!res.ok) {
      // Fallback to V2
      const resV2 = await fetch("https://api.bolna.ai/v2/voices", {
        headers: { "Authorization": `Bearer ${key}` }
      });
      if (!resV2.ok) return [];
      return await resV2.json();
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch voices:", err);
    return [];
  }
}

export async function fetchExecutionStatus(key, executionId) {
  const res = await fetch(`https://api.bolna.ai/executions/${executionId}`, {
    headers: { "Authorization": `Bearer ${key}` }
  });
  if (!res.ok) return null;
  return await res.json();
}


export async function analyzeSummaryWithDeepSeek(apiKey, summary) {
  if (!summary) return "Uncategorized";

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
            content: "You are an AI call classifier. Analyze the provided inbound call summary and generate a highly specific and meaningful Category Tag (2-3 words) that describes the main purpose or outcome. Examples: Fee Inquiry, Support Request, Appointment Booking, Complaint Call, Product Question, General Feedback, Callback Requested, Information Provided. Return ONLY the category tag, nothing else."
          },
          {
            role: "user",
            content: `Summary: ${summary}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) return "Uncategorized";
    const data = await res.json();
    const result = data.choices[0].message.content.trim();
    
    // Title-case the result and clean up
    const cleaned = result.replace(/['"]/g, '').replace(/\.$/, '');
    if (!cleaned || cleaned.length > 60) return "Uncategorized";
    return cleaned;
  } catch (err) {
    console.error("AI Analysis failed:", err);
    return "Uncategorized";
  }
}


export async function generateDailyReportWithDeepSeek(
  apiKey,
  stats,
  summaries,
  systemPrompt = null,
  userPrompt = null
) {
  try {
    // ── Legacy mode: no custom prompts passed (old callers still work) ──
    if (!systemPrompt || !userPrompt) {
      const prompt = `You are a business analyst evaluating daily call center performance.
Given the following numerical statistics and a list of call summaries, generate a concise report in exactly JSON format with two keys: "summary" and "conclusion".
"summary": A paragraph summarizing the day's overall outcomes and activity volume.
"conclusion": A paragraph highlighting any key insights, patterns, or actionable observations based on the lead responses and stats.

Daily Stats:
Total Calls: ${stats.total}
Completed: ${stats.completed}
Interested: ${stats.interested}
Not Interested: ${stats.notInterested}
Busy: ${stats.busy}
Rescheduled: ${stats.rescheduled}

Key Call Summaries (Sample):
${summaries.join('\n')}

Return ONLY valid JSON. Example:
{
  "summary": "...",
  "conclusion": "..."
}`;

      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();
      const content = data.choices[0].message.content;
      return JSON.parse(content);
    }

    // ── Structured Report mode: 10-section markdown report ──
    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: userPrompt   }
        ]
      })
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    return {
      fullReport: text,   // 10-section markdown string → used by ReportView for PDF
      summary: '',        // kept for backward compatibility
      conclusion: ''      // kept for backward compatibility
    };

  } catch (err) {
    console.error("AI Report Generation failed:", err);
    return {
      fullReport: null,
      summary: "Failed to generate summary. Please check your API key and connection.",
      conclusion: "Failed to generate conclusion."
    };
  }
}

export async function fetchInboundCalls(key) {
  if (!key) return [];
  try {
    const res = await fetch("https://api.bolna.ai/executions?call_direction=inbound", {
      headers: { "Authorization": `Bearer ${key}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Failed to fetch inbound calls:", err);
    return [];
  }
}