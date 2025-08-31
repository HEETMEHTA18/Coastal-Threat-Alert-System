const express = require('express');
const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Public (will be protected later)
router.get('/profile', async (req, res) => {
  try {
    // TODO: Implement user profile
    res.json({
      status: 'success',
      message: 'User profile endpoint - coming soon'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
