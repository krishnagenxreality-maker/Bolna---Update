require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(bodyParser.json());

// Helper to map DB row to API response (snake to camel)
const mapUser = (user) => {
  if (!user) return null;
  const { bolna_api_key, bolna_agent_id, user_id, ...rest } = user;
  return {
    ...rest,
    userId: user_id,
    bolnaApiKey: bolna_api_key,
    bolnaAgentId: bolna_agent_id,
    credits: user.credits || 0
  };
};

const mapRequest = (req) => {
  if (!req) return null;
  const { organization_name, script_content, credits_selected, created_at, ...rest } = req;
  return {
    ...rest,
    organizationName: organization_name,
    scriptContent: script_content,
    creditsSelected: credits_selected,
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
      const mapped = mapUser(user);
      const { password: _, ...userWithoutPassword } = mapped;
      res.json({ success: true, user: userWithoutPassword });
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
        bolna_api_key: newUser.bolnaApiKey,
        bolna_agent_id: newUser.bolnaAgentId,
        credits: newUser.credits || 0
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
    if (updatedData.bolnaApiKey !== undefined) toUpdate.bolna_api_key = updatedData.bolnaApiKey;
    if (updatedData.bolnaAgentId !== undefined) toUpdate.bolna_agent_id = updatedData.bolnaAgentId;

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
      .select('credits')
      .eq('user_id', userId)
      .single();

    if (fetchError || !user) return res.status(404).json({ success: false, message: 'User not found' });

    const currentCredits = user.credits || 0;
    if (currentCredits <= 0) {
      return res.status(400).json({ success: false, message: 'No credits remaining' });
    }

    const { data, error } = await supabase
      .from('users')
      .update({ credits: currentCredits - 1 })
      .eq('user_id', userId)
      .select('credits')
      .single();

    if (error) throw error;
    res.json({ success: true, credits: data.credits });
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
    purpose: r.purpose,
    script_content: r.scriptContent,
    credits_selected: r.creditsSelected,
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
  const { lead_category, call_date, created_at, execution_id, user_id, ...rest } = c;
  return {
    ...rest,
    leadCategory: lead_category,
    date: call_date,
    executionId: execution_id,
    userId: user_id
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
