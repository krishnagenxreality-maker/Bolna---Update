require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: users, error } = await supabase.from('users').select('user_id, bolna_api_key, bolna_agent_id');
  if (error) {
    console.error("DB error:", error);
    return;
  }
  
  const userWithKey = users.find(u => u.bolna_api_key);
  if (!userWithKey) {
    console.log("No user with a bolna key found.");
    return;
  }
  
  console.log(`Using user ${userWithKey.user_id}'s key...`);
  const apiKey = userWithKey.bolna_api_key;
  
  try {
    const res = await fetch('https://api.bolna.ai/executions', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    console.log('API Status:', res.status);
    const executions = await res.json();
    console.log('Number of executions:', Array.isArray(executions) ? executions.length : typeof executions);
    
    if (Array.isArray(executions) && executions.length > 0) {
      console.log('Sample execution keys:', Object.keys(executions[0]));
      console.log('Full sample execution:', JSON.stringify(executions[0], null, 2));
      
      // Let's also check if there is telephony_data
      const withTelephony = executions.find(e => e.telephony_data);
      if (withTelephony) {
        console.log('Sample execution with telephony keys:', Object.keys(withTelephony));
        console.log('telephony_data:', JSON.stringify(withTelephony.telephony_data, null, 2));
      }
    } else {
      console.log('Response:', executions);
    }
  } catch (err) {
    console.error('API Error:', err);
  }
}

run();
