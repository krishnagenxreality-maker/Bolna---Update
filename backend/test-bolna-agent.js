async function testBolna(apiKey, agentId) {
  const url = `https://api.bolna.ai/agent/${agentId}/executions?call_type=inbound`;
  console.log(`Testing Bolna API with URL: ${url}`);
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Found:', Array.isArray(data) ? data.length : 'N/A');
    if (Array.isArray(data) && data.length > 0) {
      console.log('First Call Sample:', JSON.stringify(data[0], null, 2).slice(0, 1000));
    } else {
      console.log('Response body:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

const key = process.argv[2];
const agent = process.argv[3];
if (key && agent) testBolna(key, agent);
else console.log('Usage: node test-bolna-agent.js KEY AGENT_ID');
