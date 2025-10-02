const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./db.js');
const app = express();
// Use a separate default port for the Node backend in local development to
// avoid colliding with the Python/uvicorn service which uses port 8000.
const PORT = process.env.PORT || 3001;

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
// Threat Reports Route - using the CommunityReport model from ./models/CommunityReport.js
app.get('/api/threatReports', async (req, res) => {
  try {
    console.log('Fetching community reports from database...');
    const CommunityReport = require('./models/CommunityReport');
    const reports = await CommunityReport.find().sort({ createdAt: -1 });
    console.log(`Found ${reports.length} reports in database`);
    if (reports.length > 0) {
      console.log('Sample report:', reports[0].title, reports[0].reportType, reports[0].status);
    }
    res.json(reports);
  } catch (error) {
    console.error('Error fetching threat reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});
// Dev-only config endpoints (e.g., mapbox public token) - safe to enable in non-production
app.use('/api/config', require('./routes/config'));
// Auth routes for login/register
app.use('/api/auth', require('./src/routes/auth'));

// OpenWeather proxy endpoint - using native fetch (Node.js 18+)
app.get('/api/openweather/current', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenWeather API key not configured' });
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    // Use native fetch (Node.js 18+)
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'OpenWeather API error' });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('OpenWeather proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🌊 CTAS Backend Server running on port ${PORT}`);
});

module.exports = app;
