const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const handler = async (event) => {
  console.log(' [CRON] Scheduler triggered...');
  
  if (!supabaseUrl || !supabaseKey) {
    return { statusCode: 500, body: 'Missing environment variables' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const now = new Date().toISOString();
    
    // 1. Fetch pending jobs
    const { data: jobs, error } = await supabase
      .from('scheduled_jobs')
      .select('id, user_id')
      .eq('status', 'Scheduled')
      .lte('scheduled_at', now);

    if (error) throw error;

    if (!jobs || jobs.length === 0) {
      return { statusCode: 200, body: 'No jobs to run.' };
    }

    console.log(` [CRON] Found ${jobs.length} jobs. Triggering execution...`);

    // 2. Import CallService and execute
    // Note: Netlify functions bundle dependencies. 
    // We point to the service directly.
    const callService = require('../../backend/src/services/call.service');

    for (const job of jobs) {
      try {
        await callService.executeJob(job.id);
      } catch (e) {
        console.error(` [CRON] Job ${job.id} failed:`, e.message);
      }
    }

    return { statusCode: 200, body: `Successfully triggered ${jobs.length} jobs.` };
  } catch (err) {
    console.error(' [CRON] Fatal Error:', err.message);
    return { statusCode: 500, body: err.message };
  }
};

// Schedule to run every minute
exports.handler = schedule('* * * * *', handler);
