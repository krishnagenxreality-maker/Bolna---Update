require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID } = require('crypto');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
  const payload = {
    id: randomUUID(),
    name: 'Test User V3',
    organization_name: 'Test Org V3',
    email: 'test_v3@example.com',
    credits_selected: 'Starter',
    purpose: 'Test Purpose V3',
    call_purpose: 'Test Call V3',
    script_content: 'Test Script V3',
    purpose_type: 'regular',
    status: 'Pending'
  };
  
  console.log('Attempting insert into requests with manual ID...');
  const { data, error } = await s.from('requests').insert([payload]).select();
  if (error) {
    console.error('Insert Failed:', error.message);
    console.error('Details:', error.details);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
