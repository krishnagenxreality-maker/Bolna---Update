require('dotenv').config({ path: require('path').join(__dirname, '..', 'backend', '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching contacts with execution_id from Supabase...");
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('*')
    .not('execution_id', 'is', null)
    .limit(10);
    
  if (error) {
    console.error("DB error:", error);
    return;
  }
  
  console.log(`Found ${contacts.length} contacts with execution_id.`);
  if (contacts.length === 0) {
    console.log("No contacts with execution_id found in Supabase.");
    return;
  }
  
  // Let's get Varun or Demo user key to fetch execution status
  const { data: users, error: userError } = await supabase.from('users').select('user_id, bolna_api_key');
  if (userError) {
    console.error("User DB error:", userError);
    return;
  }
  
  for (const contact of contacts) {
    const user = users.find(u => u.user_id === contact.user_id && u.bolna_api_key);
    if (!user) continue;
    
    console.log(`Contact ID: ${contact.id}, User: ${contact.user_id}, Exec ID: ${contact.execution_id}`);
    try {
      const res = await fetch(`https://api.bolna.ai/executions/${contact.execution_id}`, {
        headers: { 'Authorization': `Bearer ${user.bolna_api_key}` }
      });
      console.log(`Bolna API Status for execution ${contact.execution_id}: ${res.status}`);
      if (res.ok) {
        const payload = await res.json();
        console.log("Bolna Execution Payload Keys:", Object.keys(payload));
        console.log("Full Payload:", JSON.stringify(payload, null, 2));
        break; // Only print one
      } else {
        console.log("Response text:", await res.text());
      }
    } catch (err) {
      console.error("Fetch execution error:", err);
    }
  }
}

run();
