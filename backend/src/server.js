require('dns').setDefaultResultOrder('ipv4first');
// Load mongoose JSON fallback only when explicitly requested or when a MongoDB URI is present.
// This avoids initializing the Mongo fallback when using Postgres/Neon as the primary DB.
if (process.env.MONGODB_URI && process.env.MONGODB_URI.length > 0) {
  try {
    require('./lib/mongooseFallback.js');
  } catch (e) {
    console.warn('Failed to initialize mongoose fallback:', e.message);
  }
} else if (process.env.ENABLE_MONGOOSE_FALLBACK === 'true') {
  try {
    require('./lib/mongooseFallback.js');
  } catch (e) {
    console.warn('Failed to initialize mongoose fallback:', e.message);
  }
} else {
  console.log('ℹ️ Skipping mongoose fallback (no MONGODB_URI and ENABLE_MONGOOSE_FALLBACK not set).');
}
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file - this must happen before importing modules that use env vars
// In production (Render), env vars are set directly, so .env file is optional
const dotenvPath = path.join(__dirname, "../../.env"); // Look in project root
require("dotenv").config({ path: dotenvPath });

if (process.env.NODE_ENV !== 'test' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is missing. Refusing to start with insecure auth configuration.');
  process.exit(1);
}

// Log startup environment info
console.log('🔧 Environment:', process.env.NODE_ENV || 'development');
console.log('📍 Current directory:', __dirname);
const resolvedWeatherKey = process.env.WEATHER_API_KEY;
console.log('🔑 Env vars loaded:', {
  NODE_ENV: process.env.NODE_ENV || 'not set',
  PORT: process.env.PORT || 'not set',
  MONGODB_URI: process.env.MONGODB_URI ? '✓ configured' : '✗ MISSING',
  JWT_SECRET: process.env.JWT_SECRET ? '✓ configured' : '✗ MISSING',
  CORS_ORIGINS: process.env.CORS_ORIGINS || 'using defaults'
});

const { connectDB } = require('./lib/db.js');
const app = express();

// Trust proxy settings for production deployment (Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
}

// Use a separate default port for the Node backend in local development to
// avoid colliding with the Python/uvicorn service which uses port 8000.
const PORT = process.env.PORT || 3001;

// Database connection is managed inside startServer()

// Security Middleware
app.use(helmet());

// CORS Configuration - Use environment variable for allowed origins
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false,
  maxAge: 86400
};

console.log('🔐 CORS enabled for origins:', allowedOrigins);

// Apply CORS middleware early so all endpoints (including /api/health) return CORS headers
app.use(cors(corsOptions));

// Rate Limiting - Protect against abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Health Check Route (NO CORS - for Render health checks)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'CTAS Backend Server is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});


// Body Parsing Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));

// Static file serving for uploaded media
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
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
app.use('/api/ai', require('./routes/ai'));
app.use('/api/media', require('./routes/media'));
// Server-side proxy for OpenWeather to avoid exposing API key to clients
app.use('/api/openweather', require('./routes/openWeatherProxy'));

// Proxy AI model requests to local Python service (port 8000)
const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_API_URL || 'http://127.0.0.1:8000';

// Proxy all /api/predict_* and /api/forecast endpoints to AI service
app.use('/api/predict_alert', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/predict_alert`, req.body, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'AI prediction service unavailable',
      message: error.message
    });
  }
});

app.use('/api/forecast', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/forecast`, req.body, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' }
    });
    res.json(response.data);
  } catch (error) {
    console.error('AI Service Error:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'AI forecast service unavailable',
      message: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'CTAS Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global Error Handler - Must be last middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global Error:', err.stack);
  
  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

// 404 Handler - For unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Graceful Shutdown

// Test Weather Service Route
app.get('/api/test/weather', async (req, res) => {
  try {
    const OpenWeatherMapService = require('./services/openWeatherMapService');
    const weatherService = new OpenWeatherMapService(process.env.WEATHER_API_KEY);
    
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
const websocketService = require('./services/websocketService');

const startServer = async () => {
  try {
    // Connect to database (non-blocking)
    connectDB().catch(err => {
      console.log('⚠️  Database connection failed, but server will continue running');
      console.log('📱 API endpoints will be available, but database operations will fail');
    });

    // Start HTTP server
    // Bind to the specified host, or 0.0.0.0 in production (for Render/cloud deployments)
    // to receive external traffic, and default to 127.0.0.1 in local development to
    // avoid IPv6 all-address conflicts.
    const HOST = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
    const server = app.listen(PORT, HOST, () => {
      console.log(`
🌊 CTAS Backend Server Starting...
==========================================
📍 Server: http://${HOST}:${PORT}
🌐 Environment: ${process.env.NODE_ENV || 'development'}
🔑 Weather API: ${resolvedWeatherKey ? 'Configured' : 'Missing'}
🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'Missing'}
🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI Configured' : 'URI Missing'}
⏰ Started: ${new Date().toISOString()}
==========================================
      `);
    });

    // Initialize WebSocket server
    websocketService.initialize(server);

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('\n🔄 Shutting down gracefully...');
      websocketService.destroy();
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
