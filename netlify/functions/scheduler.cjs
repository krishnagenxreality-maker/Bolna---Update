const { schedule } = require('@netlify/functions');
const { createClient } = require('@supabase/supabase-js');

const handler = async (event) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Scheduler] Missing Supabase credentials');
    return { statusCode: 500, body: 'Missing config' };
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const now = new Date().toISOString();
    
    const { data: jobsToRun, error: fetchError } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('status', 'Scheduled')
      .lte('scheduled_at', now);

    if (fetchError) throw fetchError;

    if (jobsToRun && jobsToRun.length > 0) {
      const jobIds = jobsToRun.map(j => j.id);
      
      const { error: updateError } = await supabase
        .from('scheduled_jobs')
        .update({ status: 'Running' })
        .in('id', jobIds);

      if (updateError) throw updateError;

      // Also sync to campaigns table
      for (const job of jobsToRun) {
        try {
          await supabase
            .from('campaigns')
            .update({ campaign_status: 'Running', updated_at: now })
            .eq('id', job.id);
        } catch (e) { }
      }

      console.log(`[Scheduler] Triggered ${jobsToRun.length} job(s): ${jobIds.join(', ')}`);
    }

    return { statusCode: 200, body: `Checked. Found ${jobsToRun?.length || 0} jobs to trigger.` };
  } catch (err) {
    console.error('[Scheduler Error]:', err.message);
    return { statusCode: 500, body: err.message };
  }
};

// Run every minute
exports.handler = schedule('* * * * *', handler);
