const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

// POST /api/reports - Create a new report
router.post('/', async (req, res) => {
  try {
    const { type, severity, location, description, peopleAffected, flags } = req.body;
    const report = new Report({
      type,
      severity,
      location,
      description,
      peopleAffected,
      flags
    });
    await report.save();
    res.status(201).json({ status: 'success', message: 'Report saved', report });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
