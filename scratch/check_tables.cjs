const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  try {
    // This is a hacky way to list tables since Supabase JS doesn't have a direct listTables
    // We can query the public schema information if we have permissions
    const { data, error } = await supabase.rpc('get_tables'); // Try rpc first
    
    if (error) {
        // Fallback: Try a raw query if possible or just check common names
        const tables = ['users', 'contacts', 'leads', 'scheduled_jobs', 'scheduled_campaigns', 'campaigns', 'requests', 'demo_requests', 'calls', 'custom_agents'];
        console.log('Checking tables status:');
        for (const table of tables) {
            const { error: tableError } = await supabase.from(table).select('*').limit(1);
            if (!tableError) {
                console.log(`- [EXIST] ${table}`);
            } else {
                console.log(`- [MISS]  ${table} (${tableError.message})`);
            }
        }
    } else {
        console.log('Tables:', data);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

listTables();
