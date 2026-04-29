const testData = {
  name: 'Test User',
  organizationName: 'Test Org',
  purpose: 'Test Purpose',
  scriptContent: 'Test Script',
  creditsSelected: '1000 credits'
};

async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    const data = await res.json();
    console.log('Response Status:', res.status);
    console.log('Response Data:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
