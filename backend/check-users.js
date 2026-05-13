require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
  const { data, error } = await supabase.from('users').select('user_id, bolna_api_key, bolna_agent_id');
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }
  console.log('Users in DB:', data.map(u => ({ 
    id: u.user_id, 
    hasKey: !!u.bolna_api_key, 
    keyPreview: u.bolna_api_key ? u.bolna_api_key.slice(0, 5) + '...' : 'NONE' 
  })));
}

checkUser();
