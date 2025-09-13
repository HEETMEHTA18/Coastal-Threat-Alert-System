const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file - this must happen before importing modules that use env vars
require("dotenv").config({ path: path.join(__dirname, "../.env") });
console.log("MONGODB_URI =", process.env.MONGODB_URI);
console.log("PORT =", process.env.PORT);


const connectDB = require('./lib/db.js');
const app = express();
const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());

// CORS Configuration for Production and Development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Handle comma-separated origins from environment variable
    const envOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(url => url.trim()) : [];
    
    const allowedOrigins = [
      'http://localhost:5173',  // Local development
      'http://localhost:3000',  // Alternative local port
      'https://coastal-threat-alert-system-two.vercel.app', // Remove trailing slash
      'https://coastal-threat-alert-system-myz7b50jn-heetmehta18s-projects.vercel.app', // Actual Vercel URL
      ...envOrigins // Spread environment origins
    ].filter(Boolean); // Remove undefined values
    
    console.log('CORS check - Origin:', origin);
    console.log('CORS check - Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));


// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CTAS Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/health', require('./routes/healthCheck'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/threats', require('./routes/threats'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/weather', require('./routes/weather'));
app.use('/api/satellite', require('./routes/satellite'));
app.use('/api/users', require('./routes/users'));
app.use('/api/noaa', require('./routes/noaaRoutes'));
app.use('/api/enhanced-coastal', require('./routes/enhancedCoastal'));
app.use('/api/community-reports', require('./routes/communityReports'));
app.use('/api/threatReports', require('./routes/threatReports'));

// Test Weather Service Route
app.get('/api/test/weather', async (req, res) => {
  try {
    const OpenWeatherMapService = require('./services/openWeatherMapService');
    const weatherService = new OpenWeatherMapService(process.env.OPENWEATHER_API_KEY);
    
    const testResult = await weatherService.testAPIKey();
    
    if (testResult.status === 'success') {
      const currentWeather = await weatherService.getCurrentWeather('Mumbai');
      res.json({
        status: 'success',
        message: 'Weather service is working',
        apiKeyValid: true,
        sampleData: currentWeather
      });
    } else {
      res.status(400).json({
        status: 'error',
        message: 'Weather API key not working',
        error: testResult.message
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Weather service error',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'CTAS API is running' });
});

// Catch all handler
app.get('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to database (non-blocking)
    connectDB().catch(err => {
      console.log('⚠️  Database connection failed, but server will continue running');
      console.log('📱 API endpoints will be available, but database operations will fail');
    });

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`
🌊 CTAS Backend Server Starting...
==========================================
📍 Server: http://localhost:${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔑 Weather API: ${process.env.OPENWEATHER_API_KEY ? 'Configured' : 'Missing'}
🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}
🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI Configured' : 'URI Missing'}
⏰ Started: ${new Date().toISOString()}
==========================================
      `);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🔄 Shutting down gracefully...');
      server.close(() => {
        console.log('🔌 HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
