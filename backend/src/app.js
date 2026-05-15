const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request Logging
app.use((req, res, next) => {
  console.log(` [REQ] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api', routes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(' [ERROR] Unhandled Exception:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error'
  });
});

module.exports = app;
