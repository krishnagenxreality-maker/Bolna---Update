const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Categorize a call summary using DeepSeek AI
 */
const analyzeSummary = async (summary) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  console.log(` [DEEPSEEK] API Key present: ${apiKey ? 'YES (' + apiKey.substring(0, 8) + '...)' : 'NO'}`);
  
  if (!apiKey) {
    console.warn(' [DEEPSEEK] Missing DEEPSEEK_API_KEY env var. Returning Uncategorized.');
    return "Uncategorized";
  }
  
  if (!summary || summary.trim().length === 0) {
    console.warn(' [DEEPSEEK] Empty summary provided. Returning Uncategorized.');
    return "Uncategorized";
  }

  console.log(` [DEEPSEEK] Analyzing summary (${summary.length} chars): "${summary.substring(0, 100)}..."`);

  const requestPayload = {
    model: "deepseek-chat",
    messages: [
      {
        role: "system",
        content: "You are an AI call classifier. Analyze the provided call summary and generate a highly specific and meaningful Category Tag (2-3 words) that describes the outcome. Examples: Fee Inquiry, Support Request, Appointment Booking, Interested, Not Interested, Callback Requested, Follow Up, Information Request, Complaint, Purchase Intent, Schedule Visit, Price Inquiry, Demo Request. Return ONLY the category tag, nothing else."
      },
      {
        role: "user",
        content: `Summary: ${summary}`
      }
    ],
    temperature: 0.3
  };

  console.log(` [DEEPSEEK] Request payload:`, JSON.stringify({ model: requestPayload.model, messageCount: requestPayload.messages.length }));

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    });

    console.log(` [DEEPSEEK] Response status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(` [DEEPSEEK] API Error: ${res.status} - ${errText}`);
      return "Uncategorized";
    }

    const data = await res.json();
    console.log(` [DEEPSEEK] Raw response:`, JSON.stringify(data.choices?.[0]?.message));

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error(` [DEEPSEEK] Unexpected response structure:`, JSON.stringify(data));
      return "Uncategorized";
    }

    const result = data.choices[0].message.content.trim();
    const cleaned = result.replace(/['"]/g, '').replace(/\.$/, '');
    
    console.log(` [DEEPSEEK] ✓ Result: "${cleaned}"`);
    
    if (!cleaned || cleaned.length === 0) {
      return "Uncategorized";
    }
    
    return cleaned.slice(0, 60);
  } catch (err) {
    console.error(" [DEEPSEEK] Request Failed:", err.message);
    return "Uncategorized";
  }
};

module.exports = {
  analyzeSummary
};
