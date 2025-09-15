const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./db.js');
const app = express();
const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());

// Body Parsing Middleware
app.use(express.json());

// CORS Configuration - Allow localhost for development and production domain
app.use(cors({
  origin: ['https://coastal-threat-alert-system-two.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

// Logging
app.use(morgan('combined'));

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CTAS Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Reports Route (JSON only)
app.use('/api/reports', require('./routes/reports'));

// Start server
app.listen(PORT, () => {
  console.log(`🌊 CTAS Backend Server running on port ${PORT}`);
});

module.exports = app;
