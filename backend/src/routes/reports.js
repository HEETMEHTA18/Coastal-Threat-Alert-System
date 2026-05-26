const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { prisma } = require('../lib/db');

// @route   GET /api/reports
// @desc    Get all reports
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    let reports = [];

    try {
      reports = await prisma.environmentalReport.findMany({
        take: Math.min(parseInt(limit, 10) || 50, 200),
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr) {
      console.warn('Prisma reports fetch failed, falling back to local cache:', dbErr.message);

      const reportsFile = path.join(__dirname, '..', '..', 'uploads', 'reports.json');
      if (fs.existsSync(reportsFile)) {
        try {
          reports = JSON.parse(fs.readFileSync(reportsFile, 'utf8')) || [];
        } catch (cacheErr) {
          console.warn('Failed to read cached reports:', cacheErr.message);
          reports = [];
        }
      }
    }

    res.json({
      status: 'success',
      data: reports,
      count: reports.length
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { title, reportType, description, latitude, longitude, severity, imageUrl } = req.body || {};

    // Basic validation
    if (!title || !reportType) {
      return res.status(400).json({ status: 'error', message: 'title and reportType are required' });
    }

    // Prepare a normalized payload for Prisma EnvironmentalReport
    const reportId = `RPT_${Date.now()}_${Math.random().toString(36).substr(2,6)}`;
    const normalized = {
      id: reportId,
      reportId,
      reportType: reportType || 'environmental',
      title: title || 'Untitled report',
      description: description || '',
      location: (latitude && longitude) ? `${latitude},${longitude}` : (req.body.location || 'unspecified'),
      latitude: Number(latitude) || 0.0,
      longitude: Number(longitude) || 0.0,
      contactName: req.body.reporter || 'anonymous',
      contactPhone: req.body.phone || '',
      contactEmail: req.body.email || null,
      contactOrganization: req.body.organization || null,
      severity: (severity || 'medium').toLowerCase(),
      source: 'community',
      visibility: 'public'
    };

    let created = null;
    try {
      created = await prisma.environmentalReport.create({ data: normalized });
    } catch (dbErr) {
      console.warn('Prisma insert failed, falling back to local JSON store:', dbErr.message);
    }

    // Always append to local reports.json as a cache/fallback
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const reportsFile = path.join(uploadsDir, 'reports.json');
    let reports = [];
    if (fs.existsSync(reportsFile)) {
      try { reports = JSON.parse(fs.readFileSync(reportsFile)); } catch (e) { reports = []; }
    }

    const localEntry = {
      id: require('crypto').randomUUID(),
      title: normalized.title,
      reportType: normalized.reportType,
      description: normalized.description,
      location: normalized.location,
      latitude: normalized.latitude,
      longitude: normalized.longitude,
      severity: normalized.severity,
      image: imageUrl || null,
      status: 'submitted',
      createdAt: new Date().toISOString()
    };

    reports.unshift(localEntry);
    fs.writeFileSync(reportsFile, JSON.stringify(reports, null, 2));

    if (created) {
      res.status(201).json({ status: 'success', data: created });
    } else {
      res.status(201).json({ status: 'success', data: localEntry, note: 'stored locally because DB insert failed' });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
