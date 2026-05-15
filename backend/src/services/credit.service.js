const supabase = require('./supabase.service');

/**
 * Deduct 1 credit for a user atomatically
 */
const deductCredit = async (userId) => {
  console.log(` [CREDIT] Attempting deduction for user: ${userId}`);

  try {
    // We use a select-then-update approach. 
    // In a truly high-traffic app, we would use an RPC function in Postgres for atomicity.
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_credits, used_credits, credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      console.error(` [CREDIT] User ${userId} lookup failed`);
      return false;
    }

    const currentRemaining = user.remaining_credits !== undefined ? user.remaining_credits : (user.credits || 0);
    const currentUsed = user.used_credits || 0;

    if (currentRemaining <= 0) {
      console.warn(` [CREDIT] Insufficient balance for ${userId}`);
      return false;
    }

    const newRemaining = currentRemaining - 1;
    const newUsed = currentUsed + 1;

    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        remaining_credits: newRemaining,
        used_credits: newUsed,
        credits: newRemaining // Legacy sync
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error(` [CREDIT] Update failed for ${userId}:`, updateError.message);
      return false;
    }

    console.log(` [CREDIT] Success! ${userId}: ${currentRemaining} -> ${newRemaining}`);
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
