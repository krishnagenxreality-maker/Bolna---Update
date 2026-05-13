require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

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

// Helper to map DB row to API response (snake to camel)
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
      // Session Control: Single device login
      // Restriction applies only to Starter Plan. Growth and Pro Plans allow multiple devices.
      const currentPlan = user.selected_plan || 'Starter';
      const isRestrictedPlan = currentPlan === 'Starter';

      if (isRestrictedPlan && user.device_session && !req.body.forceLogout && userId !== 'AdminGenx') {
        return res.status(403).json({ 
          success: false, 
          message: 'This account is already logged in on another device. Please logout from other device or click Logout Other Devices.',
          sessionActive: true
        });
      }

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
  
  try {
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        user_id: newUser.userId,
        password: hashedPassword,
        role: newUser.role || 'user',
        organization: newUser.organization,
        email: newUser.email || '',
        bolna_api_key: newUser.bolnaApiKey,
        bolna_agent_id: newUser.bolnaAgentId,
        credits: newUser.credits || 2000,
        selected_plan: newUser.selectedPlan || 'Starter',
        total_credits: newUser.totalCredits || 2000,
        used_credits: 0,
        remaining_credits: newUser.totalCredits || 2000,
        user_type: newUser.userType || 'regular',
        is_first_login: true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ success: false, message: 'User ID already exists' });
      throw error;
    }

    res.json({ success: true, user: mapUser(data) });
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
    res.json({ success: true, user: mapUser(data) });
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
  return {
    ...rest,
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data.map(mapContact));
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/contacts', async (req, res) => {
  const { userId, contacts } = req.body;
  if (!userId || !Array.isArray(contacts)) {
    return res.status(400).json({ success: false, message: 'Invalid data' });
  }

  try {
    const contactsToInsert = contacts.map(c => ({
      id: c.id.toString(),
      user_id: userId,
      name: c.name,
      phone: c.phone,
      status: c.status,
      response: c.response,
      summary: c.summary,
      lead_category: c.leadCategory,
      execution_id: c.executionId,
      recording_url: c.recordingUrl || null,
      call_date: c.date || new Date().toISOString().split('T')[0]
    }));

    const { data, error } = await supabase
      .from('contacts')
      .upsert(contactsToInsert, { onConflict: 'id' })
      .select();

    if (error) throw error;

    // Handle dedicated leads table persistence
    const leadsToInsert = contactsToInsert
      .filter(c => c.lead_category && c.lead_category !== "")
      .map(c => ({
        user_id: userId,
        name: c.name,
        phone: c.phone,
        category: c.lead_category,
        summary: c.summary,
        call_date: c.call_date
      }));

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

// --- EDUCATION DASHBOARD ---

app.get('/api/education/dashboard-data/:userId', async (req, res) => {
  const { userId } = req.params;
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  try {
    // 1. Total Calls Made
    // 0. Get user's students for filtering
    const { data: userStudents } = await supabase.from('students').select('id').eq('created_by', userId);
    const studentIds = (userStudents || []).map(s => s.id);

    // 1. Total Calls Made (User specific)
    const { count: totalCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    // 2. Number of Leads (Linked via students)
    let totalLeads = 0;
    if (studentIds.length > 0) {
      const { count } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds);
      totalLeads = count || 0;
    }

    // 3. Students Present/Absent Today (Linked via students)
    let presentCount = 0;
    let absentCount = 0;
    if (studentIds.length > 0) {
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today)
        .in('student_id', studentIds);
      
      presentCount = attendanceData ? attendanceData.filter(a => a.status === 'present').length : 0;
      absentCount = attendanceData ? attendanceData.filter(a => a.status === 'absent').length : 0;
    }

    // 4. Call Volume Graph (Last 7 Days)
    const { data: volumeData } = await supabase
      .from('calls')
      .select('created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgoStr)
      .order('created_at', { ascending: true });

    // Group by date
    const volumeByDay = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      volumeByDay[d.toISOString().split('T')[0]] = 0;
    }
    
    if (volumeData) {
      volumeData.forEach(call => {
        const date = call.created_at.split('T')[0];
        if (volumeByDay[date] !== undefined) {
          volumeByDay[date]++;
        }
      });
    }

    const callVolume = Object.entries(volumeByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 5. Recent Activity (User specific)
    const [callsRes, leadsRes, apptsRes] = await Promise.all([
      supabase.from('calls').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
      studentIds.length > 0
        ? supabase.from('leads').select('*').in('student_id', studentIds).order('created_at', { ascending: false }).limit(5)
        : Promise.resolve({ data: [] }),
      studentIds.length > 0 
        ? supabase.from('appointments').select('*').in('student_id', studentIds).order('date', { ascending: false }).limit(5)
        : Promise.resolve({ data: [] })
    ]);

    const recentActivity = [
      ...(callsRes.data || []).map(c => ({ type: 'call', date: c.created_at, description: `${c.status} - ${c.classification || 'N/A'}` })),
      ...(leadsRes.data || []).map(l => ({ type: 'lead', date: l.created_at, description: `Lead: ${l.classification || 'N/A'}` })),
      ...(apptsRes.data || []).map(a => ({ type: 'appointment', date: `${a.date}T${a.time || '00:00:00'}`, description: `Appt: ${a.student_name} (${a.status})` }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    res.json({
      success: true,
      data: {
        totalCalls: totalCalls || 0,
        totalLeads: totalLeads || 0,
        presentCount,
        absentCount,
        callVolume,
        recentActivity
      }
    });

  } catch (err) {
    console.error('Education dashboard data error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- STUDENTS MANAGEMENT ---

app.get('/api/education/students/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('created_by', userId)
      .order('student_name', { ascending: true });

    if (error) throw error;
    res.json({ success: true, students: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/education/students/:userId', async (req, res) => {
  const { userId } = req.params;
  const { students } = req.body;
  
  if (!Array.isArray(students)) return res.status(400).json({ success: false, message: 'Invalid data' });

  try {
    const toInsert = students.map(s => ({
      student_name: s.name,
      parent_name: s.parentName,
      parent_phone: s.phone,
      created_by: userId
    }));

    // For simplicity, we delete existing students for this user and insert new ones
    // Or we could use upsert if we had a unique constraint on phone/name/user
    await supabase.from('students').delete().eq('created_by', userId);
    
    const { data, error } = await supabase
      .from('students')
      .insert(toInsert)
      .select();

    if (error) throw error;
    res.json({ success: true, count: data.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/education/daily-stats/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  try {
    // 1. Attendance stats for this user's students
    const { data: students } = await supabase.from('students').select('id').eq('created_by', userId);
    const studentIds = (students || []).map(s => s.id);

    if (studentIds.length === 0) {
      return res.json({ success: true, stats: { totalCalls: 0, present: 0, absent: 0, callsMade: 0 } });
    }

    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', date)
      .in('student_id', studentIds);

    const present = attendance ? attendance.filter(a => a.status === 'present').length : 0;
    const absent = attendance ? attendance.filter(a => a.status === 'absent').length : 0;

    // 2. Call stats
    const { count: callsCount, error: callsError } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .filter('created_at', 'gte', `${date}T00:00:00`)
      .filter('created_at', 'lte', `${date}T23:59:59`);

    res.json({
      success: true,
      stats: {
        totalCalls: callsCount || 0,
        present,
        absent,
        callsMade: callsCount || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ATTENDANCE MANAGEMENT ---

app.get('/api/education/attendance/:userId/:date', async (req, res) => {
  const { userId, date } = req.params;
  try {
    const { data: students } = await supabase.from('students').select('id').eq('created_by', userId);
    const studentIds = (students || []).map(s => s.id);

    if (studentIds.length === 0) return res.json({ success: true, attendance: [] });

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date)
      .in('student_id', studentIds);

    if (error) throw error;
    res.json({ success: true, attendance: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/education/attendance/:userId', async (req, res) => {
  const { userId } = req.params;
  const { date, attendance } = req.body; // attendance is [{ student_id, status }]

  if (!Array.isArray(attendance)) return res.status(400).json({ success: false, message: 'Invalid data' });

  try {
    const toUpsert = attendance.map(a => ({
      student_id: a.student_id,
      date: date,
      status: a.status
    }));

    // Perform upsert based on student_id and date
    // Note: This requires a unique constraint in the DB on (student_id, date)
    const { data, error } = await supabase
      .from('attendance')
      .upsert(toUpsert, { onConflict: 'student_id,date' })
      .select();

    if (error) throw error;
    res.json({ success: true, count: data.length });
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
    const { data: user } = await supabase.from('users').select('selected_plan').eq('user_id', userId).single();
    if (user && user.selected_plan === 'Starter') {
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

  const newJobToInsert = {
    id: Date.now().toString(),
    user_id: userId,
    campaign_title: campaignTitle || 'Untitled Campaign',
    agent_id: agentId,
    agent_name: agentName || 'Default Agent',
    contacts: contacts,
    scheduled_at: scheduledAt,
    api_key: apiKey,
    status: 'Scheduled',
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

startScheduler();

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

setTimeout(backfillCampaigns, 5000);
// --- CUSTOM AGENTS ---

app.get('/api/custom-agents/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const { data, error } = await supabase
      .from('custom_agents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, agents: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/custom-agents', async (req, res) => {
  const { userId, agentName, script, scriptType, bolnaAgentId, voiceId, voiceName } = req.body;
  
  if (!userId || !agentName || !script || !bolnaAgentId) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const { data, error } = await supabase
      .from('custom_agents')
      .insert([{
        user_id: userId,
        agent_name: agentName,
        script: script,
        script_type: scriptType || 'manual',
        bolna_agent_id: bolnaAgentId,
        voice_id: voiceId,
        voice_name: voiceName
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, agent: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin: Get all custom agents across all users
app.get('/api/custom-agents-all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('custom_agents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, agents: data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
