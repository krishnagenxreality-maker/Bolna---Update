require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const emailService = require('./emailService');

const tempPasswordsPath = path.join(__dirname, 'temp_passwords.json');
const lowCreditNotifiedPath = path.join(__dirname, 'low_credit_notified.json');

// Helper to read JSON safely
function readJsonFile(filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading file ${filePath}:`, err);
  }
  return defaultValue;
}

// Helper to write JSON safely
function writeJsonFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error writing file ${filePath}:`, err);
  }
}

// Memory OTP store for forgot password flow
const otpStore = {};

// Helper to monitor user credits and trigger a single low credit email alert
async function checkAndNotifyLowCredits(userId, remainingCredits) {
  try {
    if (remainingCredits <= 100) {
      const notified = readJsonFile(lowCreditNotifiedPath);
      if (!notified[userId]) {
        // Fetch user email
        const { data: user, error } = await supabase
          .from('users')
          .select('email')
          .eq('user_id', userId)
          .single();

        if (user && user.email) {
          await emailService.sendLowCreditsEmail(user.email, remainingCredits);
          // Set notified to true
          notified[userId] = true;
          writeJsonFile(lowCreditNotifiedPath, notified);
          console.log(`Low credit warning sent to ${user.email} (${remainingCredits} credits remaining)`);
        }
      }
    } else {
      // Clear the notified flag if credits are topped up > 100
      const notified = readJsonFile(lowCreditNotifiedPath);
      if (notified[userId]) {
        notified[userId] = false;
        writeJsonFile(lowCreditNotifiedPath, notified);
        console.log(`Low credit warning flag reset for ${userId} (credits replenished to ${remainingCredits})`);
      }
    }
  } catch (err) {
    console.error(`Error in checkAndNotifyLowCredits for user ${userId}:`, err);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const HOST = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: '*', // Allow all origins for development accessibility
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

const mapUser = (user) => {
  if (!user) return null;
  const { 
    bolna_api_key, bolna_agent_id, user_id, is_first_login, 
    selected_plan, total_credits, used_credits, remaining_credits,
    active_sessions, report_usage_weekly, report_usage_monthly,
    campaign_count, device_session, ...rest 
  } = user;
  
  return {
    ...rest,
    userId: user_id,
    bolnaApiKey: bolna_api_key,
    bolnaAgentId: bolna_agent_id,
    credits: remaining_credits !== undefined ? remaining_credits : (user.credits || 0),
    selectedPlan: selected_plan || 'Starter',
    totalCredits: total_credits || 2000,
    usedCredits: used_credits || 0,
    remainingCredits: remaining_credits !== undefined ? remaining_credits : (user.credits || 0),
    activeSessions: active_sessions || 0,
    reportUsageWeekly: report_usage_weekly || 0,
    reportUsageMonthly: report_usage_monthly || 0,
    campaignCount: campaign_count || 0,
    deviceSession: device_session || null,
    isFirstLogin: user_id !== 'AdminGenx' && is_first_login !== false,
    userType: user.user_type || 'regular'
  };
};

const mapRequest = (req) => {
  if (!req) return null;
  const { organization_name, script_content, credits_selected, created_at, call_purpose, ...rest } = req;
  return {
    ...rest,
    organizationName: organization_name,
    scriptContent: script_content,
    creditsSelected: credits_selected,
    callPurpose: call_purpose,
    purposeType: rest.purpose_type || 'regular',
    createdAt: created_at
  };
};

const mapDemoRequest = (req) => {
  if (!req) return null;
  const { 
    full_name, business_type, use_cases, call_volume, 
    current_process, demo_date, demo_time, created_at, ...rest 
  } = req;
  return {
    ...rest,
    fullName: full_name,
    businessType: business_type,
    useCases: use_cases || [],
    callVolume: call_volume,
    currentProcess: current_process,
    demoDate: demo_date,
    demoTime: demo_time,
    createdAt: created_at
  };
};

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { userId, password } = req.body;
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const currentPlan = user.selected_plan || 'Starter';
    
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      passwordMatch = (password === user.password);
      if (passwordMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await supabase.from('users').update({ password: hashedPassword }).eq('user_id', userId);
      }
    }
    if (passwordMatch) {
      const deviceSessionToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      
      // Update session token in DB
      await supabase.from('users').update({ 
        device_session: deviceSessionToken,
        active_sessions: 1 
      }).eq('user_id', userId);

      const updatedUserRes = await supabase.from('users').select('*').eq('user_id', userId).single();
      const mapped = mapUser(updatedUserRes.data);
      const { password: _, ...userWithoutPassword } = mapped;
      
      res.json({ 
        success: true, 
        user: userWithoutPassword, 
        isFirstLogin: userWithoutPassword.isFirstLogin,
        userType: userWithoutPassword.userType,
        deviceSession: deviceSessionToken
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin: Get all users
app.get('/api/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(users.map(mapUser));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Create new user
app.post('/api/users', async (req, res) => {
  const newUser = req.body;
  const demoRequestId = newUser.demoRequestId;
  
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return res.status(500).json({
      success: false,
      message: 'Configuration Error: SUPABASE_SERVICE_ROLE_KEY is missing in production environment. Row-Level Security (RLS) is blocking inserts.'
    });
  }

  // Explicitly initialize administrative Supabase client using the service role key to bypass RLS
  const supabaseAdmin = createClient(process.env.SUPABASE_URL, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Generate placeholder email if not provided/empty
    const emailToUse = (newUser.email && newUser.email.trim())
      ? newUser.email.trim()
      : `${newUser.userId.toLowerCase()}@callinggen.in`;

    // 1. Create the user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailToUse,
      password: newUser.password,
      email_confirm: true,
      user_metadata: {
        userId: newUser.userId,
        role: newUser.role || 'user'
      }
    });

    if (authError) {
      return res.status(400).json({
        success: false,
        message: `Auth User Creation Failed: ${authError.message}`
      });
    }

    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    
    // 2. Insert corresponding user record in public users table using the Auth user's ID as primary key
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{
        id: authData.user.id, // Map public users id to auth users id
        user_id: newUser.userId,
        password: hashedPassword,
        role: newUser.role || 'user',
        organization: newUser.organization,
        email: newUser.email || '',
        bolna_api_key: newUser.bolnaApiKey,
        bolna_agent_id: newUser.bolnaAgentId,
        credits: newUser.credits !== undefined ? newUser.credits : 2000,
        total_credits: newUser.totalCredits !== undefined ? newUser.totalCredits : 2000,
        used_credits: 0,
        remaining_credits: newUser.remainingCredits !== undefined ? newUser.remainingCredits : 2000,
        selected_plan: newUser.selectedPlan || 'Starter',
        user_type: newUser.userType || 'regular',
        is_first_login: true
      }])
      .select()
      .single();

    if (error) {
      // Transaction Rollback: delete the created Auth user if public users insertion fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (rollbackError) {
        console.error(`Rollback failed to delete auth user ${authData.user.id}:`, rollbackError);
      }

      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'User ID already exists' });
      }
      throw error;
    }

    // If created from a demo request, update the request status
    if (demoRequestId) {
      await supabaseAdmin
        .from('demo_requests')
        .update({ status: 'Assigned' })
        .eq('id', demoRequestId);
    }

    // Store original temporary password in local cache for manual Send Credentials button
    const tempPasswords = readJsonFile(tempPasswordsPath);
    tempPasswords[newUser.userId] = { tempPassword: newUser.password };
    writeJsonFile(tempPasswordsPath, tempPasswords);

    // Automatically send welcome email with credentials
    if (newUser.email) {
      emailService.sendAccountCreatedEmail(newUser.email, newUser.userId, newUser.password)
        .catch(err => console.error(`Error sending account created email to ${newUser.email}:`, err));
    }

    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Send / Resend user credentials manually
app.post('/api/users/send-credentials/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    // 1. Fetch user to get registered email
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const email = user.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'User does not have a registered email address' });
    }

    // 2. Lookup temp password cache
    const tempPasswords = readJsonFile(tempPasswordsPath);
    let tempPassword = tempPasswords[userId]?.tempPassword;

    // 3. Fallback: Generate if missing (e.g. server restart)
    if (!tempPassword) {
      // Generate a new random 8-character temporary password
      tempPassword = Math.random().toString(36).substring(2, 10);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Update Supabase and set is_first_login = true
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password: hashedPassword,
          is_first_login: true 
        })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      // Update local cache
      tempPasswords[userId] = { tempPassword };
      writeJsonFile(tempPasswordsPath, tempPasswords);
    }

    // 4. Send email
    await emailService.sendAccountCreatedEmail(email, userId, tempPassword);

    res.json({ success: true, message: 'Credentials sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete user
app.delete('/api/users/:userId', async (req, res) => {
  const { userId } = req.params;

  if (userId === 'AdminGenx') {
    return res.status(403).json({ success: false, message: 'Cannot delete the primary administrator' });
  }

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update user
app.put('/api/users/:oldUserId', async (req, res) => {
  const { oldUserId } = req.params;
  const updatedData = req.body;

  if (oldUserId === 'AdminGenx' && updatedData.userId !== 'AdminGenx') {
    return res.status(403).json({ success: false, message: 'Cannot change the primary administrator ID' });
  }

  try {
    const toUpdate = {};
    if (updatedData.userId) toUpdate.user_id = updatedData.userId;
    if (updatedData.password) {
      if (!updatedData.password.startsWith('$2')) {
        toUpdate.password = await bcrypt.hash(updatedData.password, 10);
      } else {
        toUpdate.password = updatedData.password;
      }
    }
    if (updatedData.role) toUpdate.role = updatedData.role;
    if (updatedData.organization !== undefined) toUpdate.organization = updatedData.organization;
    if (updatedData.email !== undefined) toUpdate.email = updatedData.email;
    if (updatedData.bolnaApiKey !== undefined) toUpdate.bolna_api_key = updatedData.bolnaApiKey;
    if (updatedData.bolnaAgentId !== undefined) toUpdate.bolna_agent_id = updatedData.bolnaAgentId;
    if (updatedData.userType !== undefined) toUpdate.user_type = updatedData.userType;
    if (updatedData.selectedPlan !== undefined) toUpdate.selected_plan = updatedData.selectedPlan;
    if (updatedData.totalCredits !== undefined) toUpdate.total_credits = updatedData.totalCredits;
    if (updatedData.usedCredits !== undefined) toUpdate.used_credits = updatedData.usedCredits;
    if (updatedData.remainingCredits !== undefined) {
      toUpdate.remaining_credits = updatedData.remainingCredits;
      toUpdate.credits = updatedData.remainingCredits; // Sync with legacy field
    }

    const { data, error } = await supabase
      .from('users')
      .update(toUpdate)
      .eq('user_id', oldUserId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ success: false, message: 'New User ID already exists' });
      throw error;
    }

    if (data) {
      const rem = data.remaining_credits !== undefined ? data.remaining_credits : (data.credits || 0);
      checkAndNotifyLowCredits(oldUserId, rem).catch(err => console.error("Error in checkAndNotifyLowCredits helper:", err));
    }

    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Logout Endpoint
app.post('/api/logout', async (req, res) => {
  const { userId } = req.body;
  try {
    await supabase.from('users').update({ 
      device_session: null,
      active_sessions: 0 
    }).eq('user_id', userId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Get config
app.get('/api/user-config/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('bolna_api_key, bolna_agent_id, organization, credits')
      .eq('user_id', userId)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      bolnaApiKey: user.bolna_api_key,
      bolnaAgentId: user.bolna_agent_id,
      organization: user.organization,
      credits: user.credits || 0
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Get credits
app.get('/api/user-credits/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (error || !user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ credits: user.credits || 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Deduct 1 credit
app.post('/api/user-credits/deduct/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_credits, used_credits, credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentRemaining = user.remaining_credits !== undefined ? user.remaining_credits : (user.credits || 0);
    const currentUsed = user.used_credits || 0;

    if (currentRemaining <= 0) {
      return res.status(400).json({ success: false, message: 'No credits remaining' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ 
        remaining_credits: currentRemaining - 1,
        used_credits: currentUsed + 1,
        credits: currentRemaining - 1 // Sync with legacy field
      })
      .eq('user_id', userId)
      .select('remaining_credits, used_credits, credits')
      .single();

    if (error) throw error;

    // Asynchronously monitor credit threshold and trigger alerts
    checkAndNotifyLowCredits(userId, data.remaining_credits).catch(err => console.error("Error in checkAndNotifyLowCredits helper:", err));

    res.json({ 
      success: true, 
      credits: data.remaining_credits,
      usedCredits: data.used_credits 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Add credits
app.post('/api/user-credits/add/:userId', async (req, res) => {
  const { userId } = req.params;
  const { amount } = req.body;
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('remaining_credits, total_credits, credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: 'User not found' });

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

    // Asynchronously monitor credit threshold and reset alerts
    checkAndNotifyLowCredits(userId, data.remaining_credits).catch(err => console.error("Error in checkAndNotifyLowCredits helper:", err));

    res.json({ success: true, credits: data.remaining_credits, totalCredits: data.total_credits });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Track Report Usage
app.post('/api/reports/track/:userId', async (req, res) => {
  const { userId } = req.params;
  const { type } = req.body; // 'weekly' or 'monthly'
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('report_usage_weekly, report_usage_monthly')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: 'User not found' });

    const update = {};
    if (type === 'weekly') update.report_usage_weekly = (user.report_usage_weekly || 0) + 1;
    if (type === 'monthly') update.report_usage_monthly = (user.report_usage_monthly || 0) + 1;

    const { data, error } = await supabase
      .from('users')
      .update(update)
      .eq('user_id', userId)
      .select('report_usage_weekly, report_usage_monthly')
      .single();

    if (error) throw error;
    res.json({ success: true, usage: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Set new password (first-time login)
app.post('/api/users/set-password/:userId', async (req, res) => {
  const { userId } = req.params;
  const { password } = req.body;

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

    // Send password updated confirmation email
    if (data.email) {
      emailService.sendPasswordUpdatedEmail(data.email, userId)
        .catch(err => console.error(`Error sending password updated email to ${data.email}:`, err));
    }

    // Clear plain text temp credentials from cache
    const tempPasswords = readJsonFile(tempPasswordsPath);
    delete tempPasswords[userId];
    writeJsonFile(tempPasswordsPath, tempPasswords);

    res.json({ success: true, user: mapUser(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Auth: Forgot Password - Step 1/2/3 Request OTP
app.post('/api/auth/forgot-password/request', async (req, res) => {
  const { userIdOrEmail } = req.body;
  if (!userIdOrEmail) {
    return res.status(400).json({ success: false, message: 'User ID or Email is required' });
  }

  try {
    // 1. Fetch user by user_id or email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`user_id.eq.${userIdOrEmail},email.eq.${userIdOrEmail}`)
      .maybeSingle();

    if (error) throw error;
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.email) {
      return res.status(400).json({ success: false, message: 'This user does not have a registered email address for verification' });
    }

    // 2. Generate 6-digit verification OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP in memory store with 10-minute expiry and attempt tracking
    otpStore[user.user_id] = {
      otp,
      email: user.email,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      verified: false
    };

    // 4. Send OTP email
    await emailService.sendForgotOtpEmail(user.email, otp);

    res.json({ 
      success: true, 
      message: 'Verification OTP sent to registered email address',
      userId: user.user_id,
      emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Auth: Forgot Password - Step 4 Verify OTP
app.post('/api/auth/forgot-password/verify', async (req, res) => {
  const { userId, otp } = req.body;
  if (!userId || !otp) {
    return res.status(400).json({ success: false, message: 'User ID and OTP are required' });
  }

  try {
    const otpData = otpStore[userId];
    if (!otpData) {
      return res.status(400).json({ success: false, message: 'No active OTP verification session found' });
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      delete otpStore[userId];
      return res.status(400).json({ success: false, message: 'Verification OTP has expired (10 mins). Please request a new one' });
    }

    // Brute force defense: check attempts
    if (otpData.attempts >= 3) {
      delete otpStore[userId];
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Verification session locked. Please request a new OTP' });
    }

    // Verify code
    if (otpData.otp !== otp.trim()) {
      otpData.attempts += 1;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid verification code. ${3 - otpData.attempts} attempts remaining` 
      });
    }

    // Mark as verified
    otpData.verified = true;
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User Auth: Forgot Password - Step 5 Reset/Change Password
app.post('/api/auth/forgot-password/reset', async (req, res) => {
  const { userId, otp, newPassword } = req.body;
  if (!userId || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'All parameters (userId, otp, newPassword) are required' });
  }

  try {
    const otpData = otpStore[userId];
    if (!otpData || !otpData.verified || otpData.otp !== otp.trim()) {
      return res.status(400).json({ success: false, message: 'Unauthorized or verification session invalid' });
    }

    // Check expiry again
    if (Date.now() > otpData.expiresAt) {
      delete otpStore[userId];
      return res.status(400).json({ success: false, message: 'Verification session expired. Please request a new OTP' });
    }

    // Update password in Supabase
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        is_first_login: false // Mark is_first_login as false after password reset
      })
      .eq('user_id', userId);

    if (error) throw error;

    // Send confirmation email
    await emailService.sendPasswordUpdatedEmail(otpData.email, userId);

    // Clear caching & session
    delete otpStore[userId];
    const tempPasswords = readJsonFile(tempPasswordsPath);
    delete tempPasswords[userId];
    writeJsonFile(tempPasswordsPath, tempPasswords);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all requests
app.get('/api/requests', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(requests.map(mapRequest));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Submit a request
app.post('/api/requests', async (req, res) => {
  const r = req.body;
  const userId = r.userId; // Logged in user ID
  
  const requestToInsert = {
    id: Date.now().toString(),
    name: r.name,
    organization_name: r.organizationName,
    email: r.email || '',
    purpose: r.purpose,
    call_purpose: r.callPurpose || '',
    script_content: r.scriptContent || '',
    credits_selected: r.creditsSelected,
    purpose_type: r.purposeType || 'regular',
    status: 'pending'
  };

  try {
    const { data, error } = await supabase
      .from('requests')
      .insert([requestToInsert])
      .select()
      .single();

    if (error) throw error;

    // Handle Demo User Conversion logic if userId is provided
    if (userId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!userError && user && user.user_type === 'demo') {
        // Map plan names to credits
        const planCredits = {
          'Starter': 2000,
          'Growth': 6000
        };
        const creditsToAssign = planCredits[r.creditsSelected] || 2000;

        // Convert demo user to regular
        await supabase
          .from('users')
          .update({
            user_type: 'regular',
            selected_plan: r.creditsSelected,
            total_credits: creditsToAssign,
            remaining_credits: creditsToAssign,
            credits: creditsToAssign,
            used_credits: 0
          })
          .eq('user_id', userId);

        // Update original demo request if it exists
        // (Assuming email matches or we have a more direct link)
        await supabase
          .from('demo_requests')
          .update({ status: 'Converted' })
          .eq('email', user.email);
      }
    }

    res.json({ success: true, request: mapRequest(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Update request status
app.put('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, request: mapRequest(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all demo requests
app.get('/api/demo-requests', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('demo_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(requests.map(mapDemoRequest));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// User: Submit a demo request
app.post('/api/demo-requests', async (req, res) => {
  const r = req.body;
  
  // Ensure we have the minimum required fields to avoid NOT NULL violations
  if (!r.fullName || !r.company || !r.email || !r.phone) {
    return res.status(400).json({ success: false, message: 'Missing required fields: fullName, company, email, and phone are mandatory.' });
  }

  const demoToInsert = {
    full_name: r.fullName,
    company: r.company,
    email: r.email,
    phone: r.phone,
    website: r.website || '',
    business_type: r.businessType || 'Other',
    use_cases: Array.isArray(r.useCases) ? r.useCases : [],
    call_volume: r.callVolume || 'Unknown',
    languages: Array.isArray(r.languages) ? r.languages : [],
    current_process: r.currentProcess || 'Other',
    demo_date: r.demoDate || '',
    demo_time: r.demoTime || '',
    timezone: r.timezone || '',
    notes: r.notes || '',
    status: 'Pending'
  };

  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .insert([demoToInsert])
      .select();

    if (error) {
      console.error('Supabase Demo Request Insert Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned from database after insertion');
    }

    res.json({ success: true, request: mapDemoRequest(data[0]) });
  } catch (err) {
    console.error('Demo Request API Error:', err);
    res.status(500).json({ success: false, message: err.message || 'An internal server error occurred while saving the demo request.' });
  }
});

// Admin: Update demo request status
app.put('/api/demo-requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('demo_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, request: mapDemoRequest(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete demo request
app.delete('/api/demo-requests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('demo_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Delete request
app.delete('/api/requests/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- CONTACTS ---

const mapContact = (c) => {
  if (!c) return null;
  const { lead_category, call_date, created_at, execution_id, user_id, classification, recording_url, ...rest } = c;
  
  let summaryText = c.summary || "";
  let duration = null;
  
  try {
    if (c.summary && c.summary.startsWith('{') && c.summary.endsWith('}')) {
      const parsed = JSON.parse(c.summary);
      if (parsed && typeof parsed === 'object') {
        summaryText = parsed.text || "";
        duration = parsed.duration !== undefined ? parsed.duration : null;
      }
    }
  } catch (e) {
    // summary is not JSON, keep it as-is
  }

  return {
    ...rest,
    summary: summaryText,
    duration: duration,
    leadCategory: lead_category || classification, // Support both field names
    classification: classification,
    date: call_date,
    executionId: execution_id,
    userId: user_id,
    recordingUrl: recording_url || "",
    createdAt: created_at
  };
};

app.get('/api/contacts/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    
    const mapped = (data || []).map(mapContact);
    
    // Sort mapped contacts in-memory by the timestamp embedded in the ID (newest first)
    mapped.sort((a, b) => {
      const getTs = (c) => {
        if (c.id && c.id.includes('::')) {
          const parts = c.id.split('::');
          if (parts.length >= 3) {
            const tsParts = parts[2].split('-');
            const ts = parseInt(tsParts[0], 10);
            if (!isNaN(ts)) return ts;
          }
        }
        return 0;
      };
      
      const tsA = getTs(a);
      const tsB = getTs(b);
      
      if (tsA !== tsB) {
        return tsB - tsA; // Newest first
      }
      
      // Fallback: compare dates
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Secure backend endpoint for DeepSeek summary categorization analysis
app.post('/api/analyze-summary', async (req, res) => {
  const { summary } = req.body;
  if (!summary) {
    return res.json({ success: true, category: 'Uncategorized' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.error('[AnalyzeSummary] Missing DEEPSEEK_API_KEY in environment');
    return res.json({ success: true, category: 'Uncategorized' });
  }

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a call analysis assistant. Analyze the call summary and generate a short descriptive Category Title (2-5 words) that captures the primary outcome or intent of the call. Examples: Fee Payment Confirmed, Student Marked Present, Parent Requested Callback, Appointment Rescheduled, Product Interested, Complaint Registered, Follow-up Needed, Not Interested, Information Provided, Voicemail Left. Return ONLY the category title, nothing else."
          },
          {
            role: "user",
            content: `Summary: ${summary}`
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AnalyzeSummary] DeepSeek API error: ${response.status} - ${errText}`);
      return res.json({ success: true, category: 'Uncategorized' });
    }

    const data = await response.json();
    const result = (data.choices?.[0]?.message?.content || '').trim();
    const cleaned = result.replace(/['"]/g, '').replace(/\.$/, '');
    
    res.json({ success: true, category: cleaned || 'Uncategorized' });
  } catch (err) {
    console.error("[AnalyzeSummary] AI Analysis failed:", err);
    res.json({ success: true, category: 'Uncategorized' });
  }
});

app.post('/api/contacts', async (req, res) => {
  const { userId, contacts } = req.body;
  if (!userId || !Array.isArray(contacts)) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const contactsToInsert = contacts.map(c => {
      let dbSummary = c.summary;
      // If we have duration information, store it serialized in the summary text column
      if (c.duration !== undefined && c.duration !== null) {
        dbSummary = JSON.stringify({
          text: c.summary || "",
          duration: c.duration
        });
      }
      return {
        id: c.id.toString(),
        user_id: userId,
        name: c.name,
        phone: c.phone,
        status: c.status,
        response: c.response,
        summary: dbSummary,
        lead_category: c.leadCategory,
        execution_id: c.executionId,
        recording_url: c.recordingUrl || null,
        call_date: c.date || new Date().toISOString().split('T')[0]
      };
    });

    const { data, error } = await supabase
      .from('contacts')
      .upsert(contactsToInsert, { onConflict: 'id' })
      .select();

    if (error) throw error;

    // Handle dedicated leads table persistence
    const leadsToInsert = contactsToInsert
      .filter(c => c.lead_category && c.lead_category !== "")
      .map(c => {
        // Strip duration packaging for the leads table
        let cleanSummary = c.summary;
        try {
          if (c.summary && c.summary.startsWith('{') && c.summary.endsWith('}')) {
            const parsed = JSON.parse(c.summary);
            if (parsed && typeof parsed === 'object') {
              cleanSummary = parsed.text || "";
            }
          }
        } catch (e) {}

        return {
          user_id: userId,
          name: c.name,
          phone: c.phone,
          category: c.lead_category,
          summary: cleanSummary,
          call_date: c.call_date
        };
      });

    if (leadsToInsert.length > 0) {
      // Use upsert on leads table as well, but matching by user/phone/date/category 
      // to avoid duplicate lead entries for the same call analysis
      const { error: leadError } = await supabase
        .from('leads')
        .upsert(leadsToInsert, { 
          onConflict: 'user_id,phone,call_date,category' 
        });

      if (leadError) {
        console.error('CRITICAL: Leads storage failed:', leadError);
      } else {
        console.log(`Successfully synced ${leadsToInsert.length} leads to Supabase.`);
      }
    }

    res.json({ success: true, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/cleanup-leads', async (req, res) => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .lt('created_at', oneMonthAgo.toISOString())
      .not('lead_category', 'is', null);

    if (error) throw error;
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- SCHEDULED CALLS ---

// Helper to map DB row to API response (snake to camel) for jobs
const mapJob = (job) => {
  if (!job) return null;
  const { user_id, campaign_title, agent_id, agent_name, scheduled_at, api_key, created_at, ...rest } = job;
  return {
    ...rest,
    userId: user_id,
    campaignTitle: campaign_title,
    agentId: agent_id,
    agentName: agent_name,
    scheduledAt: scheduled_at,
    apiKey: api_key,
    createdAt: created_at
  };
};

const mapCampaign = (c) => {
  if (!c) return null;
  const { user_id, campaign_title, campaign_date, uploaded_sheet_name, total_calls, selected_agent, campaign_status, credits_used, created_at, updated_at, ...rest } = c;
  return {
    ...rest,
    userId: user_id,
    title: campaign_title,
    displayDate: campaign_date,
    sheetName: uploaded_sheet_name,
    totalCalls: total_calls,
    agentName: selected_agent,
    status: campaign_status,
    creditsUsed: credits_used,
    createdAt: created_at,
    updatedAt: updated_at
  };
};

app.get('/api/campaigns/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, campaigns: campaigns.map(mapCampaign) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/schedule/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data: jobs, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, jobs: jobs.map(mapJob) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/schedule', async (req, res) => {
  const { userId, campaignTitle, agentId, agentName, contacts, scheduledAt, apiKey } = req.body;
  
  if (!userId || !agentId || !contacts || !scheduledAt || !apiKey) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  // Plan Validation: Starter plan limits
  try {
    const { data: user } = await supabase.from('users').select('total_credits').eq('user_id', userId).single();
    if (user && user.total_credits < 5000) {
      // Check for any "Scheduled" or "Running" jobs for this user today
      const today = new Date().toISOString().split('T')[0];
      const { data: activeJobs } = await supabase
        .from('scheduled_jobs')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['Scheduled', 'Running', 'Running-Acknowledge'])
        .gte('scheduled_at', `${today}T00:00:00`)
        .lte('scheduled_at', `${today}T23:59:59`);

      if (activeJobs && activeJobs.length > 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Starter Plan Limit: You can only have 1 active or scheduled campaign at a time today. Please wait for your current campaign to complete or upgrade to Growth plan.' 
        });
      }
    }
  } catch (e) { }

  // Determine if this is an immediate call
  const isImmediate = new Date(scheduledAt) <= new Date();
  const jobStatus = isImmediate ? 'Running' : (req.body.status || 'Scheduled');

  const newJobToInsert = {
    id: Date.now().toString(),
    user_id: userId,
    campaign_title: campaignTitle || 'Untitled Campaign',
    agent_id: agentId,
    agent_name: agentName || 'Default Agent',
    contacts: contacts,
    scheduled_at: scheduledAt,
    api_key: apiKey,
    status: jobStatus,
    created_at: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .insert([newJobToInsert])
      .select()
      .single();

    if (error) throw error;

    // Also sync to campaigns table
    try {
      await supabase.from('campaigns').insert([{
        id: newJobToInsert.id,
        user_id: userId,
        campaign_title: campaignTitle || 'Untitled Campaign',
        campaign_date: scheduledAt.split('T')[0],
        uploaded_sheet_name: req.body.sheetName || (contacts[0]?.sheetName) || 'N/A',
        total_calls: contacts.length,
        selected_agent: agentName || 'Default Agent',
        campaign_status: newJobToInsert.status,
        credits_used: 0
      }]);
    } catch (campaignError) {
      console.error('Failed to sync to campaigns table:', campaignError.message);
    }

    res.json({ success: true, job: mapJob(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/schedule/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase
      .from('scheduled_jobs')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Background Watcher Engine
const startScheduler = () => {
  setInterval(async () => {
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

        for (let job of jobsToRun) {
          console.log(`[Scheduler] Job ${job.id} (${job.campaign_title}) triggered for user ${job.user_id}. Frontend will handle execution.`);
        }
      }
    } catch (err) {
      console.error('[Scheduler Error]:', err.message);
    }
  }, 30000); // Check every 30 seconds
};

// Only start scheduler when running as standalone server (not serverless)
if (require.main === module) {
  startScheduler();
}

// Update Job Status
app.post('/api/schedule/status', async (req, res) => {
  const { jobId, status } = req.body;
  try {
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .update({ status })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Sync status to campaigns table
    try {
      await supabase
        .from('campaigns')
        .update({ campaign_status: status, updated_at: new Date().toISOString() })
        .eq('id', jobId);
    } catch (e) { }
    
    res.json({ success: true, status: data.status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Backfill existing campaigns from scheduled_jobs to campaigns table
const backfillCampaigns = async () => {
  try {
    const { data: jobs } = await supabase.from('scheduled_jobs').select('*');
    if (!jobs || jobs.length === 0) return;

    for (const job of jobs) {
      const { data: exists } = await supabase.from('campaigns').select('id').eq('id', job.id).single();
      if (!exists) {
        await supabase.from('campaigns').insert([{
          id: job.id,
          user_id: job.user_id,
          campaign_title: job.campaign_title,
          campaign_date: job.scheduled_at.split('T')[0],
          uploaded_sheet_name: job.contacts[0]?.sheetName || 'N/A',
          total_calls: job.contacts.length,
          selected_agent: job.agent_name,
          campaign_status: job.status,
          credits_used: 0,
          created_at: job.created_at
        }]);
      }
    }
    console.log('[Backfill] Campaigns table synchronized with scheduled_jobs.');
  } catch (e) {
    console.error('[Backfill Error]:', e.message);
  }
};

if (require.main === module) {
  setTimeout(backfillCampaigns, 5000);
}
// Only start listening when running as standalone server
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  });
}

// Export for serverless usage
module.exports = app;
