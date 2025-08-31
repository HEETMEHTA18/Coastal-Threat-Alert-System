const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Load environment variables from .env file - this must happen before importing modules that use env vars
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Verify MongoDB URI is loaded
console.log("MongoDB URI defined:", !!process.env.MONGODB_URI);
if (!process.env.MONGODB_URI) {
  console.error("ERROR: MongoDB URI is not defined in environment variables!");
  process.exit(1);
}

const connectDB = require('./lib/db.js');
const app = express();
const PORT = process.env.PORT || 8000;

// Connect to Database
connectDB();

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));


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
app.use('/api/noaa', require('./routes/simpleNoaaRoutes'));
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
