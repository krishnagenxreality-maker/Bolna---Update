const supabase = require('./supabase.service');

/**
 * Deduct 1 credit for a user (idempotent per execution_id)
 * Uses ATOMIC update to prevent race conditions.
 */
const deductCredit = async (userId, executionId = null) => {
  console.log(` [CREDIT] Attempting deduction for user: ${userId}${executionId ? ` (exec: ${executionId})` : ''}`);

  try {
    // Idempotency check: if executionId is provided, check if already deducted
    if (executionId) {
      const { data: existing } = await supabase
        .from('responses')
        .select('credits_deducted')
        .eq('execution_id', executionId)
        .single();
      
      if (existing && existing.credits_deducted === true) {
        console.log(` [CREDIT] Already deducted for execution ${executionId}. Skipping.`);
        return false;
      }
    }

    // ATOMIC credit deduction — no read-then-write race condition
    // Uses RPC or direct SQL-style atomic update via Supabase
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_credits, used_credits, credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      console.error(` [CREDIT] User ${userId} lookup failed:`, fetchError?.message);
      return false;
    }

    const currentRemaining = user.remaining_credits !== undefined ? user.remaining_credits : (user.credits || 0);
    const currentUsed = user.used_credits || 0;

    if (currentRemaining <= 0) {
      console.warn(` [CREDIT] Insufficient balance for ${userId} (${currentRemaining})`);
      return false;
    }

    const newRemaining = currentRemaining - 1;
    const newUsed = currentUsed + 1;

    // Atomic update: only update if remaining_credits hasn't changed (optimistic lock)
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update({ 
        remaining_credits: newRemaining,
        used_credits: newUsed,
        credits: newRemaining // Legacy sync
      })
      .eq('user_id', userId)
      .eq('remaining_credits', currentRemaining) // Optimistic lock
      .select('remaining_credits')
      .single();

    if (updateError || !updated) {
      console.error(` [CREDIT] Atomic update failed for ${userId} (race condition or error):`, updateError?.message);
      return false;
    }

    // Mark as deducted for idempotency
    if (executionId) {
      try {
        await supabase
          .from('responses')
          .update({ credits_deducted: true })
          .eq('execution_id', executionId);
        console.log(` [CREDIT] Marked execution ${executionId} as credits_deducted`);
      } catch (markErr) {
        console.warn(` [CREDIT] Could not mark credits_deducted:`, markErr.message);
        // Non-blocking — deduction already succeeded
      }
    }

    console.log(` [CREDIT] ✓ Success! ${userId}: ${currentRemaining} -> ${newRemaining}`);
    return true;
  } catch (err) {
    console.error(` [CREDIT] Pipeline crash for ${userId}:`, err.message);
    return false;
  }
};

/**
 * Add credits (Admin only)
 */
const addCredits = async (userId, amount) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_credits, total_credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) return { success: false, message: 'User not found' };

    const newRemaining = (user.remaining_credits || 0) + amount;
    const newTotal = (user.total_credits || 0) + amount;

    const { data, error } = await supabase
      .from('users')
      .update({ 
        remaining_credits: newRemaining,
        total_credits: newTotal,
        credits: newRemaining
      })
      .eq('user_id', userId)
      .select('remaining_credits, total_credits')
      .single();

    if (error) throw error;
    return { success: true, credits: data.remaining_credits, totalCredits: data.total_credits };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

module.exports = {
  deductCredit,
  addCredits
};
