const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authController.login);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', authController.logout);

// @route   GET /api/auth/test
// @desc    Test auth route
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Auth route working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
