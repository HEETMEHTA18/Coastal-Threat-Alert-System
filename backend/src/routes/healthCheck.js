/**
 * Health check routes to verify API is running
 */
const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    API health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    message: 'CTAS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/health/extended
 * @desc    Extended health check with environment info
 * @access  Public
 */
router.get('/extended', (req, res) => {
  return res.status(200).json({
    status: 'OK',
    message: 'CTAS Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    nodeVersion: process.version
  });
});

module.exports = router;
