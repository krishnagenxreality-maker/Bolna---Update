const supabase = require('../services/supabase.service');
const bcrypt = require('bcryptjs');
const { mapUser } = require('../utils/mapper');

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    res.json(data.map(mapUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createUser = async (req, res) => {
  const newUser = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    const userToInsert = {
      user_id: newUser.userId,
      password: hashedPassword,
      role: newUser.role || 'user',
      organization: newUser.organization,
      email: newUser.email || '',
      bolna_api_key: newUser.bolnaApiKey,
      bolna_agent_id: newUser.bolnaAgentId,
      total_credits: newUser.totalCredits || 2000,
      remaining_credits: newUser.totalCredits || 2000,
      credits: newUser.totalCredits || 2000,
      user_type: newUser.userType || 'regular',
      is_first_login: true
    };
    const { data, error } = await supabase.from('users').insert([userToInsert]).select().single();
    if (error) throw error;
    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const { userId } = req.params;
  const updateData = req.body;
  try {
    const toUpdate = {
      organization: updateData.organization,
      email: updateData.email,
      bolna_api_key: updateData.bolnaApiKey,
      bolna_agent_id: updateData.bolnaAgentId,
      total_credits: updateData.totalCredits,
      remaining_credits: updateData.remainingCredits,
      credits: updateData.credits,
      user_type: updateData.userType,
      selected_plan: updateData.selectedPlan
    };

    // If password is provided, hash it
    if (updateData.password && !updateData.password.startsWith('$2')) {
      toUpdate.password = await bcrypt.hash(updateData.password, 10);
    }

    const { data, error } = await supabase
      .from('users')
      .update(toUpdate)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const { userId } = req.params;
  if (userId === 'AdminGenx') return res.status(403).json({ error: 'Cannot delete admin' });
  try {
    const { error } = await supabase.from('users').delete().eq('user_id', userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
