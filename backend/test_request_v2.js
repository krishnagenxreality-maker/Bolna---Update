require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const payload = {
    name: 'Test User',
    organization_name: 'Test Org',
    email: 'test@example.com',
    credits_selected: 'Starter',
    purpose: 'Test Purpose',
    call_purpose: 'Test Call',
    script_content: 'Test Script',
    purpose_type: 'regular',
    status: 'Pending'
  };
  
  console.log('Attempting insert into requests...');
  const { data, error } = await s.from('requests').insert([payload]).select();
  if (error) {
    console.error('Insert Failed:', error.message);
    console.error('Details:', error.details);
    console.error('Hint:', error.hint);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
