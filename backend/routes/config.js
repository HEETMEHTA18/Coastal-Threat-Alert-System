const express = require('express');
const router = express.Router();

// Development-only endpoint to return non-secret public tokens (e.g., Mapbox public token)
// This endpoint will only return tokens when NODE_ENV !== 'production' to avoid accidental exposure.
router.get('/mapbox', (req, res) => {
  try {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      return res.status(403).json({ status: 'error', message: 'Not allowed in production' });
    }
    const token = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN || null;
    if (!token) return res.status(404).json({ status: 'not-found', message: 'Mapbox token not configured' });
    return res.json({ status: 'success', token });
  } catch (err) {
    console.error('Error in /api/config/mapbox', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
