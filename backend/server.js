require('dotenv').config();
const app = require('./src/app');
const supabase = require('./src/services/supabase.service');
const callService = require('./src/services/call.service');

const PORT = process.env.PORT || 5000;

/**
 * Background Scheduler Engine
 * Regularly checks for pending jobs and executes them.
 */
const startScheduler = () => {
  console.log(' [SCHEDULER] Background Job Watcher Started.');
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      
      // Fetch jobs that are 'Scheduled' and whose time has passed
      const { data: jobs, error } = await supabase
        .from('scheduled_jobs')
        .select('id, user_id')
        .eq('status', 'Scheduled')
        .lte('scheduled_at', now);

      if (error) throw error;

      if (jobs && jobs.length > 0) {
        console.log(` [SCHEDULER] Found ${jobs.length} job(s) to execute.`);
        for (const job of jobs) {
          // Execute async to keep the loop moving
          callService.executeJob(job.id).catch(err => {
            console.error(` [SCHEDULER] Job ${job.id} failed:`, err.message);
          });
        }
      }
    } catch (err) {
      console.error(' [SCHEDULER] Loop Error:', err.message);
    }
  }, 30000); // Check every 30 seconds
};

// --- START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n ========================================`);
  console.log(` BOLNA PRODUCTION BACKEND`);
  console.log(` Port: ${PORT}`);
  console.log(` Time: ${new Date().toISOString()}`);
  console.log(` ========================================\n`);

  // Start scheduler only in non-serverless environments
  if (!process.env.NETLIFY && !process.env.VERCEL) {
    startScheduler();
  }
});
