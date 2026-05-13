// Using global fetch from Node 24+
async function testBolna(apiKey) {
  console.log(`Testing Bolna API with key: ${apiKey.slice(0, 5)}...`);
  try {
    const res = await fetch('https://api.bolna.ai/executions', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    console.log('Status:', res.status);
    const data = await res.json();
    console.log('Data Type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Found:', Array.isArray(data) ? data.length : 'N/A');
    if (Array.isArray(data) && data.length > 0) {
      console.log('First Call Sample:', JSON.stringify(data[0], null, 2).slice(0, 500));
    } else {
      console.log('Response body:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Fetch Error:', err.message);
  }
}

// Replace with a real key from the previous output if needed for testing
// I will use a placeholder here for the user to fill in or I will try to use one from DB if safe.
const keyToTest = process.argv[2];
if (keyToTest) testBolna(keyToTest);
else console.log('Please provide API key as argument: node test-bolna.js YOUR_KEY');
