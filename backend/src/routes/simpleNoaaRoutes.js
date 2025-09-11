// Simple NOAA routes for testing
const express = require('express');
const router = express.Router();

// Simple test route that doesn't call external APIs
router.get('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'NOAA API routes are working',
      timestamp: new Date().toISOString(),
      apiKey: process.env.NOAA_API_KEY ? 'Present' : 'Missing'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'NOAA API test failed',
      details: error.message
    });
  }
});

// Simple echo route
router.get('/echo', (req, res) => {
  res.json({
    message: 'NOAA routes working!',
    timestamp: new Date().toISOString()
  });
});

// Cape Henry data endpoint
router.get('/cape-henry', (req, res) => {
  res.json({
    success: true,
    station: 'Cape Henry',
    data: {
      waterLevel: 2.1,
      temperature: 24.5,
      windSpeed: 12.3,
      windDirection: 180,
      timestamp: new Date().toISOString()
    }
  });
});

// Current data endpoint
router.get('/current', (req, res) => {
  res.json({
    success: true,
    station: 'General Current',
    data: {
      speed: 1.5,
      direction: 120,
      timestamp: new Date().toISOString()
    }
  });
});

// Currents data by station ID
router.get('/currents/:stationId', (req, res) => {
  const { stationId } = req.params;
  res.json({
    success: true,
    stationId,
    data: {
      speed: 1.2,
      direction: 110,
      latest: {
        speed: 1.2,
        direction: 110,
        timestamp: new Date().toISOString()
      },
      history: [
        { speed: 1.1, direction: 105, timestamp: new Date(Date.now() - 60000).toISOString() },
        { speed: 1.3, direction: 115, timestamp: new Date(Date.now() - 120000).toISOString() }
      ],
      station: {
        id: stationId,
        name: `Station ${stationId}`,
        location: 'Cape Henry Area'
      }
    }
  });
});

// NOAA connection status
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: 'connected',
    message: 'NOAA API connection is active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
