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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
