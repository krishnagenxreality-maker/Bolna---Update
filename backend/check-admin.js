require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  console.log('Checking for AdminGenx user...');
  const { data, error } = await supabase
    .from('users')
    .select('user_id, password, role')
    .eq('user_id', 'AdminGenx')
    .single();

  if (error) {
    console.error('Error fetching admin:', error.message);
  } else if (data) {
    console.log('Admin found:', data.user_id, 'Role:', data.role);
    console.log('Password hash start:', data.password.substring(0, 10), '...');
  } else {
    console.log('AdminGenx NOT FOUND.');
  }
}

checkAdmin();
