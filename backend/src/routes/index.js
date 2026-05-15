const express = require('express');
const router = express.Router();

const auth = require('../controllers/auth.controller');
const user = require('../controllers/user.controller');
const schedule = require('../controllers/schedule.controller');
const agent = require('../controllers/agent.controller');
const sync = require('../controllers/sync.controller');
const webhook = require('../controllers/webhook.controller');
const admin = require('../controllers/admin.controller');
const demo = require('../controllers/demo.controller');

// --- AUTH ---
router.post('/login', auth.login);
router.post('/logout', auth.logout);
router.post('/signup', auth.signup);

// --- ADMIN ---
router.get('/users', admin.getAllUsers);
router.post('/users', admin.createUser);
router.delete('/users/:userId', admin.deleteUser);
router.get('/demo-requests', demo.getDemoRequests);
router.post('/demo-requests', demo.submitDemoRequest);
router.post('/users/set-password/:userId', auth.login); // Placeholder for set-password logic

// --- USER & CONTACTS ---
router.get('/user-config/:userId', user.getUserConfig);
router.post('/user-config/:userId', user.updateUserConfig);
router.get('/user-credits/:userId', user.getUserConfig); // Credits often fetched with config
router.get('/contacts/:userId', user.getContacts);
router.post('/contacts', user.saveContacts);

// --- SCHEDULE & CAMPAIGNS ---
router.get('/schedule/:userId', schedule.getJobs);
router.post('/schedule', schedule.createJob);
router.delete('/schedule/:id', schedule.deleteJob);
router.get('/campaigns/list/:userId', schedule.getCampaigns);

// --- AGENTS ---
router.get('/custom-agents/:userId', agent.getAgents);
router.post('/custom-agents', agent.createAgent);

// --- SYNC & INBOUND ---
router.post('/inbound-calls/sync/:userId', sync.syncInbound);
router.post('/sync-outbound/:userId', sync.syncOutbound);

// --- WEBHOOK ---
router.post('/webhook/bolna', webhook.handleBolnaWebhook);

// --- HEALTH ---
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

module.exports = router;
