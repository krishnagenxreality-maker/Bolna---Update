const bcrypt = require('bcryptjs');
const supabase = require('../services/supabase.service');
const { mapUser } = require('../utils/mapper');

/**
 * Handle user login with session control
 */
const login = async (req, res) => {
  const { userId, password, forceLogout } = req.body;
  if (!userId || !password) return res.status(400).json({ success: false, message: "Credentials required" });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !user) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Handle plaintext or hashed passwords
    let isMatch = false;
    if (user.password.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = (password === user.password);
      if (isMatch) {
        // Auto-hash legacy plaintext passwords
        const hashed = await bcrypt.hash(password, 10);
        await supabase.from('users').update({ password: hashed }).eq('user_id', userId);
      }
    }

    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // Session Management
    const currentPlan = user.selected_plan || 'Starter';
    if (currentPlan === 'Starter' && user.device_session && !forceLogout && userId !== 'AdminGenx') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account active on another device.', 
        sessionActive: true 
      });
    }

    const deviceSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    
    const { data: updatedUser } = await supabase
      .from('users')
      .update({ device_session: deviceSessionToken, active_sessions: 1 })
      .eq('user_id', userId)
      .select()
      .single();

    const mapped = mapUser(updatedUser);
    res.json({ 
      success: true, 
      user: mapped, 
      isFirstLogin: mapped.isFirstLogin,
      userType: mapped.userType,
      deviceSession: deviceSessionToken
    });
  } catch (err) {
    console.error(' [AUTH] Login Error:', err.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  const { userId } = req.body;
  try {
    await supabase.from('users').update({ device_session: null, active_sessions: 0 }).eq('user_id', userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const signup = async (req, res) => {
  const { userId, password, organization, email, userType } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      user_id: userId,
      password: hashedPassword,
      organization: organization || "",
      email: email || "",
      role: "user",
      user_type: userType || "regular",
      total_credits: 2000,
      remaining_credits: 2000,
      credits: 2000,
      is_first_login: true
    };

    const { data, error } = await supabase.from('users').insert([newUser]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const setPassword = async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ success: false, message: "Password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        is_first_login: false 
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    console.error(' [AUTH] SetPassword Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  login,
  logout,
  signup,
  setPassword
};
