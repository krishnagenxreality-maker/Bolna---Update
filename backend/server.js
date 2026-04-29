const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DB_PATH = path.join(__dirname, 'db.json');

app.use(cors());
app.use(bodyParser.json());

// Helper to read DB
const readDB = () => {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
};

// Helper to write DB
const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
};

// Login Endpoint
app.post('/api/login', (req, res) => {
  const { userId, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.userId === userId && u.password === password);

  if (user) {
    // Return user info (excluding password)
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Admin: Get all users
app.get('/api/users', (req, res) => {
  const db = readDB();
  // Filter out admin or show all? Requirements say "Number of Users" and "User Details List".
  // Usually admin is not counted in "Number of Users" or is it? Let's show all for now.
  res.json(db.users);
});

// Admin: Create new user
app.post('/api/users', (req, res) => {
  const newUser = req.body;
  const db = readDB();
  
  if (db.users.find(u => u.userId === newUser.userId)) {
    return res.status(400).json({ success: false, message: 'User ID already exists' });
  }

  db.users.push({
    ...newUser,
    role: 'user' // Default to user role
  });
  
  writeDB(db);
  res.json({ success: true, user: newUser });
});

// Admin: Delete user
app.delete('/api/users/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDB();

  // Prevent deleting the primary admin
  if (userId === 'AdminGenx') {
    return res.status(403).json({ success: false, message: 'Cannot delete the primary administrator' });
  }

  const userIndex = db.users.findIndex(u => u.userId === userId);
  if (userIndex !== -1) {
    db.users.splice(userIndex, 1);
    writeDB(db);
    res.json({ success: true, message: 'User deleted successfully' });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Admin: Update user
app.put('/api/users/:oldUserId', (req, res) => {
  const { oldUserId } = req.params;
  const updatedData = req.body;
  const db = readDB();

  // Prevent editing the primary admin's userId (optional, but safer)
  if (oldUserId === 'AdminGenx' && updatedData.userId !== 'AdminGenx') {
    return res.status(403).json({ success: false, message: 'Cannot change the primary administrator ID' });
  }

  const userIndex = db.users.findIndex(u => u.userId === oldUserId);
  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Check if new userId already exists (if it was changed)
  if (updatedData.userId !== oldUserId) {
    if (db.users.find(u => u.userId === updatedData.userId)) {
      return res.status(400).json({ success: false, message: 'New User ID already exists' });
    }
  }

  // Merge data
  db.users[userIndex] = {
    ...db.users[userIndex],
    ...updatedData
  };

  writeDB(db);
  res.json({ success: true, user: db.users[userIndex] });
});

// User: Get config
app.get('/api/user-config/:userId', (req, res) => {
  const { userId } = req.params;
  const db = readDB();
  const user = db.users.find(u => u.userId === userId);

  if (user) {
    res.json({
      bolnaApiKey: user.bolnaApiKey,
      bolnaAgentId: user.bolnaAgentId,
      organization: user.organization
    });
  } else {
    res.status(404).json({ success: false, message: 'User not found' });
  }
});

// Admin: Get all requests
app.get('/api/requests', (req, res) => {
  const db = readDB();
  res.json(db.requests || []);
});

// User: Submit a request
app.post('/api/requests', (req, res) => {
  const newRequest = req.body;
  const db = readDB();
  
  if (!db.requests) {
    db.requests = [];
  }

  const requestWithId = {
    ...newRequest,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  db.requests.push(requestWithId);
  writeDB(db);
  
  res.json({ success: true, request: requestWithId });
});

// Admin: Update request status
app.put('/api/requests/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = readDB();

  if (!db.requests) {
    return res.status(404).json({ success: false, message: 'No requests found' });
  }

  const reqIndex = db.requests.findIndex(r => r.id === id);
  if (reqIndex !== -1) {
    db.requests[reqIndex].status = status;
    writeDB(db);
    res.json({ success: true, request: db.requests[reqIndex] });
  } else {
    res.status(404).json({ success: false, message: 'Request not found' });
  }
});

// Admin: Delete request
app.delete('/api/requests/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();

  if (!db.requests) {
    return res.status(404).json({ success: false, message: 'No requests found' });
  }

  const reqIndex = db.requests.findIndex(r => r.id === id);
  if (reqIndex !== -1) {
    db.requests.splice(reqIndex, 1);
    writeDB(db);
    res.json({ success: true, message: 'Request deleted successfully' });
  } else {
    res.status(404).json({ success: false, message: 'Request not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
