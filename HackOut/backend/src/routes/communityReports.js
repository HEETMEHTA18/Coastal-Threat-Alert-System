const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const CommunityReport = require('../models/CommunityReport');
const SMSService = require('../services/smsService');
const router = express.Router();

// Initialize SMS service
const smsService = new SMSService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/community-reports');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi|webm/;
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeType = allowedTypes.test(file.mimetype);
    
    if (mimeType && extName) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// POST /api/community-reports - Create new report
router.post('/', upload.array('media', 10), async (req, res) => {
  try {
    const reportData = JSON.parse(req.body.reportData);
    
    // Add media information if files were uploaded
    if (req.files && req.files.length > 0) {
      reportData.media = req.files.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path
      }));
    }

    const report = new CommunityReport(reportData);
    await report.save();

    // Send SMS alerts using SMS service
    const smsResults = await sendSMSAlerts(report);
    
    // Update SMS statistics
    report.smsAlerts.sent = smsResults.total;
    report.smsAlerts.successful = smsResults.successful;
    report.smsAlerts.failed = smsResults.failed;
    report.smsAlerts.lastSentAt = new Date();
    await report.save();

    res.status(201).json({
      success: true,
      message: 'Community report submitted successfully',
      report: report,
      smsResults: smsResults
    });

  } catch (error) {
    console.error('Error creating community report:', error);
    
    // Clean up uploaded files if report creation failed
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create community report',
      error: error.message
    });
  }
});

// GET /api/community-reports - Get all reports with filtering
router.get('/', async (req, res) => {
  try {
    const {
      type,
      severity,
      status,
      timeRange,
      lat,
      lng,
      radius,
      limit = 50,
      offset = 0,
      search
    } = req.query;

    let query = {};

    // Apply filters
    if (type && type !== 'all') query.reportType = type;
    if (severity && severity !== 'all') query.severity = severity;
    if (status && status !== 'all') query.status = status;

    // Time range filter
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      if (timeRanges[timeRange]) {
        query.createdAt = {
          $gte: new Date(now.getTime() - timeRanges[timeRange])
        };
      }
    }

    // Geographic filter
    if (lat && lng && radius) {
      query.coordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    const reports = await CommunityReport.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('verification.verifiedBy', 'name role')
      .populate('responses.responderId', 'name role')
      .populate('acknowledgedBy.userId', 'name role');

    const total = await CommunityReport.countDocuments(query);

    res.json({
      success: true,
      reports: reports,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching community reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community reports',
      error: error.message
    });
  }
});

// GET /api/community-reports/:id - Get specific report
router.get('/:id', async (req, res) => {
  try {
    const report = await CommunityReport.findById(req.params.id)
      .populate('verification.verifiedBy', 'name role')
      .populate('responses.responderId', 'name role')
      .populate('acknowledgedBy.userId', 'name role')
      .populate('relatedReports');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    res.json({
      success: true,
      report: report
    });

  } catch (error) {
    console.error('Error fetching community report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch community report',
      error: error.message
    });
  }
});

// PUT /api/community-reports/:id/status - Update report status
router.put('/:id/status', async (req, res) => {
  try {
    const { status, notes, responderId } = req.body;
    
    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    report.status = status;
    
    if (status === 'resolved') {
      report.resolvedAt = new Date();
      report.resolvedBy = responderId;
      report.resolutionNotes = notes;
    }

    await report.save();

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: report
    });

  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update report status',
      error: error.message
    });
  }
});

// POST /api/community-reports/:id/response - Add response to report
router.post('/:id/response', async (req, res) => {
  try {
    const { responderId, responderType, message, action } = req.body;
    
    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    await report.addResponse(responderId, responderType, message, action);

    res.json({
      success: true,
      message: 'Response added successfully',
      report: report
    });

  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
});

// POST /api/community-reports/:id/sms - Send additional SMS alerts
router.post('/:id/sms', async (req, res) => {
  try {
    const { radius, urgentAlert, customMessage } = req.body;
    
    const report = await CommunityReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    // Update SMS radius if provided
    if (radius) {
      report.notifications.smsRadius = radius;
    }

    // Send SMS alerts using SMS service
    const smsResults = await sendSMSAlerts(report, customMessage, urgentAlert);
    
    // Update SMS statistics
    report.smsAlerts.sent += smsResults.total;
    report.smsAlerts.successful += smsResults.successful;
    report.smsAlerts.failed += smsResults.failed;
    report.smsAlerts.lastSentAt = new Date();
    
    // Add recipients to the list
    smsResults.details.forEach(detail => {
      report.smsAlerts.recipients.push({
        phone: detail.to,
        status: detail.success ? 'sent' : 'failed',
        sentAt: detail.sentAt
      });
    });

    await report.save();

    res.json({
      success: true,
      message: 'SMS alerts sent successfully',
      smsResults: smsResults,
      report: report
    });

  } catch (error) {
    console.error('Error sending SMS alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send SMS alerts',
      error: error.message
    });
  }
});

// GET /api/community-reports/statistics - Get report statistics
router.get('/statistics', async (req, res) => {
  try {
    const stats = await CommunityReport.getStatistics();
    
    // Additional statistics
    const recentReports = await CommunityReport.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    const criticalActiveReports = await CommunityReport.countDocuments({
      status: 'active',
      severity: 'critical'
    });

    res.json({
      success: true,
      statistics: {
        ...stats[0],
        recentReports24h: recentReports,
        criticalActiveReports: criticalActiveReports
      }
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// GET /api/community-reports/nearby - Find reports near coordinates
router.get('/nearby/:lat/:lng', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const { radius = 10, limit = 20 } = req.query;

    const reports = await CommunityReport.findNearby(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    ).limit(parseInt(limit));

    res.json({
      success: true,
      reports: reports,
      count: reports.length
    });

  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby reports',
      error: error.message
    });
  }
});

// Send SMS alerts using SMS service
async function sendSMSAlerts(report, customMessage = null, urgentAlert = false) {
  try {
    const { coordinates, notifications } = report;
    const radius = notifications.smsRadius;
    
    // Find recipients within radius
    const recipients = await smsService.findRecipientsInRadius(
      coordinates.lat,
      coordinates.lng,
      radius
    );

    if (recipients.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        details: [],
        message: 'No recipients found in the specified radius'
      };
    }

    // Send emergency alerts
    const results = await smsService.sendEmergencyAlert(report, recipients, customMessage);
    
    return results;

  } catch (error) {
    console.error('SMS alert sending error:', error);
    throw error;
  }
}

module.exports = router;
