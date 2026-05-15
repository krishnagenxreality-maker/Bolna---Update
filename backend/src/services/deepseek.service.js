const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

/**
 * Categorize a call summary using DeepSeek AI
 */
const analyzeSummary = async (summary) => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn(' [DEEPSEEK] Missing API Key. Returning Uncategorized.');
    return "Uncategorized";
  }
  
  if (!summary) return "Uncategorized";

  console.log(` [DEEPSEEK] Analyzing summary (${summary.length} chars)...`);

  try {
    const res = await fetch(DEEPSEEK_API_URL, {
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
            content: "You are an AI call classifier. Analyze the provided call summary and generate a highly specific and meaningful Category Tag (2-3 words) that describes the outcome. Examples: Fee Inquiry, Support Request, Appointment Booking, Interested, Not Interested, Callback Requested. Return ONLY the category tag, nothing else."
          },
          {
            role: "user",
            content: `Summary: ${summary}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(` [DEEPSEEK] API Error: ${res.status} - ${errText}`);
      return "Uncategorized";
    }

    const data = await res.json();
    const result = data.choices[0].message.content.trim();
    const cleaned = result.replace(/['"]/g, '').replace(/\.$/, '');
    
    console.log(` [DEEPSEEK] Result: "${cleaned}"`);
    return cleaned.slice(0, 60) || "Uncategorized";
  } catch (err) {
    console.error(" [DEEPSEEK] Request Failed:", err.message);
    return "Uncategorized";
  }
};

module.exports = {
  analyzeSummary
};
