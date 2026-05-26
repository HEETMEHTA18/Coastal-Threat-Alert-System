const express = require('express');
const { prisma } = require('../lib/db');
const SMSService = require('../services/smsService');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/auth');
const { flattenReportData, nestReportData } = require('../controllers/threatReportController');
const router = express.Router();

const multer = require('multer');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize SMS service
const smsService = new SMSService();

// Helper to calculate priority
const calculatePriority = (severity, immediateRisk, evacuationNeeded) => {
  if (severity === 'critical' || immediateRisk) return 10;
  if (severity === 'high' || evacuationNeeded) return 8;
  if (severity === 'medium') return 5;
  return 3;
};

// POST /api/community-reports/upload - Upload image to Cloudinary (with local fallback)
router.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // Verify Cloudinary configuration - fallback gracefully if not configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.warn('⚠️ Cloudinary not fully configured in environment, returning mock image URL');
      // Simulate upload delay
      await new Promise(r => setTimeout(r, 800));
      return res.json({
        success: true,
        url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=800'
      });
    }

    // Upload via stream
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'coastal_guardian_reports' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload stream error:', error);
          return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: error.message });
        }
        res.json({
          success: true,
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    );

    uploadStream.end(req.file.buffer);
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({ success: false, message: 'Server upload handler error', error: error.message });
  }
});

// POST /api/community-reports - Create new report
// Community incident reports can be submitted by any authenticated active user.
// Higher-risk actions such as broadcasts and status changes remain role/permission gated.
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📝 Received community report submission');

    const reportData = typeof req.body.reportData === 'string' ? JSON.parse(req.body.reportData) : req.body.reportData;
    if (!reportData.reportId) {
      reportData.reportId = `CR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Auto calculate priority and tags
    const immediateRisk = reportData.emergencyDetails?.immediateRisk || false;
    const evacuationNeeded = reportData.emergencyDetails?.evacuationNeeded || false;
    const priority = calculatePriority(reportData.severity || 'medium', immediateRisk, evacuationNeeded);
    
    const tags = reportData.tags || [];
    if (tags.length === 0) {
      tags.push(reportData.reportType || 'environmental', reportData.severity || 'medium');
      if (immediateRisk) tags.push('immediate_risk');
      if (evacuationNeeded) tags.push('evacuation');
      if (reportData.emergencyDetails?.infrastructureDamage) tags.push('infrastructure');
      if (reportData.notifications?.urgentAlert) tags.push('urgent');
    }

    const flattened = flattenReportData(reportData);
    flattened.id = require('crypto').randomUUID();
    flattened.priority = priority;
    flattened.tags = tags;

    // Save to PostgreSQL using Prisma
    const report = await prisma.environmentalReport.create({
      data: flattened
    });

    // Save report images (media) to database if present
    const mediaUrls = reportData.media || [];
    if (mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        try {
          await prisma._runQuery(
            'INSERT INTO "ReportImage" (id, url, "reportId") VALUES ($1, $2, $3)',
            [require('crypto').randomUUID(), url, report.id]
          );
        } catch (imageErr) {
          console.error('Failed to link image to report:', imageErr);
        }
      }
    }

    const nestedReport = nestReportData(report);
    nestedReport.media = mediaUrls;

    // Respond immediately to the client so UI isn't blocked by SMS sending
    res.status(201).json({
      success: true,
      message: 'Community report submitted successfully; SMS alerts are being sent',
      report: nestedReport
    });

    // Fire-and-forget: send SMS alerts asynchronously and persist results
    (async () => {
      try {
        console.log('📨 Starting async SMS alerts for report', report.id);
        const smsResults = await sendSMSAlerts(report);

        // Update SMS statistics on the saved report in PostgreSQL
        await prisma.environmentalReport.update({
          where: { id: report.id },
          data: {
            smsSent: smsResults.total,
            smsSuccessful: smsResults.successful,
            smsFailed: smsResults.failed,
            smsLastSentAt: new Date()
          }
        });
        console.log('✅ Async SMS alerts completed for report', report.id);
      } catch (err) {
        console.error('Async SMS sending failed for report', report.id, err);
      }
    })();

  } catch (error) {
    console.error('❌ Error creating community report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create community report',
      error: error.message
    });
  }
});

// POST /api/community-reports/broadcast - Notify all active users (operator broadcast)
router.post('/broadcast', authenticateToken, requireRole('operator', 'admin'), async (req, res) => {
  try {
    const { title, message, urgentAlert = false } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Title and message are required for broadcasts'
      });
    }

    const activeUsers = await prisma._runQuery(
      'SELECT id, phone, "smsNotifications" FROM "User" WHERE status = $1',
      ['active']
    );

    const recipients = activeUsers.rows || [];
    const smsRecipients = recipients
      .filter((user) => user.smsNotifications && user.phone)
      .map((user) => smsService.formatPhoneNumber(user.phone))
      .filter((phone) => smsService.validatePhoneNumber(phone));

    for (const user of recipients) {
      await prisma._runQuery(
        'INSERT INTO "Notification" (id, "userId", title, message) VALUES ($1, $2, $3, $4)',
        [require('crypto').randomUUID(), user.id, title, message]
      );
    }

    const smsResults = smsRecipients.length > 0
      ? await smsService.sendBulkSMS(smsRecipients, message, urgentAlert)
      : { total: 0, successful: 0, failed: 0, details: [] };

    res.json({
      success: true,
      message: 'Broadcast sent successfully',
      audience: {
        usersNotified: recipients.length,
        smsRecipients: smsRecipients.length
      },
      smsResults
    });
  } catch (error) {
    console.error('Error sending broadcast notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send broadcast notification',
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
      offset = 0
    } = req.query;

    const where = {};
    if (type && type !== 'all') where.reportType = type;
    if (severity && severity !== 'all') where.severity = severity;
    if (status && status !== 'all') where.status = status;

    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const timeRanges = {
        '1h': 1 * 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      
      if (timeRanges[timeRange]) {
        where.createdAt = {
          gte: new Date(now.getTime() - timeRanges[timeRange])
        };
      }
    }

    // Geolocation filtering using bounding box approximation or SQL query
    let reports = [];
    let total = 0;

    if (lat && lng && radius) {
      // Use Haversine SQL formula for spatial queries
      const r = parseFloat(radius);
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      
      const sqlQuery = `
        SELECT r.*, (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude)))) AS distance 
        FROM "EnvironmentalReport" r
        WHERE (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude)))) <= $3
        ORDER BY r.priority DESC, r."createdAt" DESC
        LIMIT $4 OFFSET $5
      `;
      
      const countQuery = `
        SELECT COUNT(*)
        FROM "EnvironmentalReport"
        WHERE (6371 * acos(cos(radians($1)) * cos(radians(latitude)) * cos(radians(longitude) - radians($2)) + sin(radians($1)) * sin(radians(latitude)))) <= $3
      `;

      const dbReports = await prisma._runQuery(sqlQuery, [latitude, longitude, r, parseInt(limit), parseInt(offset)]);
      const countRes = await prisma._runQuery(countQuery, [latitude, longitude, r]);
      
      reports = dbReports.rows;
      total = parseInt(countRes.rows[0].count);
    } else {
      reports = await prisma.environmentalReport.findMany({
        where,
        take: parseInt(limit),
        skip: parseInt(offset)
      });
      total = await prisma.environmentalReport.count({ where });
    }

    // Nest and load comments for populated data
    const nestedReports = await Promise.all(reports.map(async (rep) => {
      const nested = nestReportData(rep);
      
      // Fetch associated comments (responses)
      const comments = await prisma.comment.findMany({
        where: { reportId: rep.id }
      });

      nested.responses = comments.map(c => ({
        responderId: { _id: c.userId, name: 'Authority Agent', role: 'operator' }, // Emulate populate
        responderType: c.userType,
        message: c.message,
        action: c.action,
        timestamp: c.createdAt
      }));

      // Fetch AI Analysis if present
      const aiAnalysis = await prisma.aiAnalysis.findUnique({
        where: { reportId: rep.id }
      });
      nested.aiAnalysis = aiAnalysis;

      // Fetch associated images
      try {
        const images = await prisma._runQuery('SELECT url FROM "ReportImage" WHERE "reportId" = $1', [rep.id]);
        nested.media = images.rows.map(img => img.url);
      } catch (imageErr) {
        nested.media = [];
      }

      return nested;
    }));

    res.json({
      success: true,
      reports: nestedReports,
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
    const report = await prisma.environmentalReport.findUnique({
      where: { id: req.params.id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    const nested = nestReportData(report);

    // Load comments (responses)
    const comments = await prisma.comment.findMany({
      where: { reportId: report.id }
    });

    nested.responses = comments.map(c => ({
      responderId: { _id: c.userId, name: 'Authority Agent', role: 'operator' },
      responderType: c.userType,
      message: c.message,
      action: c.action,
      timestamp: c.createdAt
    }));

    // Fetch AI Analysis
    nested.aiAnalysis = await prisma.aiAnalysis.findUnique({
      where: { reportId: report.id }
    });

    // Fetch associated images
    try {
      const images = await prisma._runQuery('SELECT url FROM "ReportImage" WHERE "reportId" = $1', [report.id]);
      nested.media = images.rows.map(img => img.url);
    } catch (imageErr) {
      nested.media = [];
    }

    res.json({
      success: true,
      report: nested
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
router.put('/:id/status', authenticateToken, requirePermission('canAcknowledgeAlerts'), async (req, res) => {
  try {
    const { status, notes, responderId } = req.body;
    
    const report = await prisma.environmentalReport.findUnique({
      where: { id: req.params.id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
      updateData.resolvedById = responderId || req.user.userId;
      updateData.resolutionNotes = notes;
    }

    const updated = await prisma.environmentalReport.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Report status updated successfully',
      report: nestReportData(updated)
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

// POST /api/community-reports/:id/response - Add response (comment) to report
router.post('/:id/response', authenticateToken, requirePermission('canAcknowledgeAlerts'), async (req, res) => {
  try {
    const { responderId, responderType, message, action } = req.body;
    
    const report = await prisma.environmentalReport.findUnique({
      where: { id: req.params.id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    // Save as a Comment in PostgreSQL
    await prisma.comment.create({
      data: {
        id: require('crypto').randomUUID(),
        reportId: report.id,
        userId: req.user.userId,
        userType: responderType || 'authority',
        message: message,
        action: action
      }
    });

    // Update status if action is resolved or investigating
    const updateData = {};
    if (action === 'resolved') {
      updateData.status = 'resolved';
      updateData.resolvedAt = new Date();
      updateData.resolvedById = req.user.userId;
    } else if (action === 'investigating') {
      updateData.status = 'investigating';
    }

    const updatedReport = await prisma.environmentalReport.update({
      where: { id: req.params.id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Response added successfully',
      report: nestReportData(updatedReport)
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
router.post('/:id/sms', authenticateToken, requirePermission('canAcknowledgeAlerts'), async (req, res) => {
  try {
    const { radius, urgentAlert, customMessage } = req.body;
    
    const report = await prisma.environmentalReport.findUnique({
      where: { id: req.params.id }
    });

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Community report not found'
      });
    }

    // Update SMS radius
    const updatedRadius = radius ? parseFloat(radius) : report.smsRadius;
    
    const updatedReport = await prisma.environmentalReport.update({
      where: { id: req.params.id },
      data: {
        smsRadius: updatedRadius,
        urgentAlert: urgentAlert !== undefined ? urgentAlert : report.urgentAlert
      }
    });

    // Send SMS alerts
    const smsResults = await sendSMSAlerts(updatedReport, customMessage, urgentAlert);
    
    // Increment SMS stats
    const finalReport = await prisma.environmentalReport.update({
      where: { id: report.id },
      data: {
        smsSent: updatedReport.smsSent + smsResults.total,
        smsSuccessful: updatedReport.smsSuccessful + smsResults.successful,
        smsFailed: updatedReport.smsFailed + smsResults.failed,
        smsLastSentAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'SMS alerts sent successfully',
      smsResults: smsResults,
      report: nestReportData(finalReport)
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
    const totalReports = await prisma.environmentalReport.count();
    const activeReports = await prisma.environmentalReport.count({ where: { status: 'active' } });
    const resolvedReports = await prisma.environmentalReport.count({ where: { status: 'resolved' } });
    const criticalReports = await prisma.environmentalReport.count({ where: { severity: 'critical' } });
    
    const smsStats = await prisma._runQuery('SELECT SUM("smsSent") as total_sms FROM "EnvironmentalReport"');
    const totalSMSSent = parseInt(smsStats.rows[0].total_sms || 0);

    const recentReports = await prisma.environmentalReport.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    const criticalActiveReports = await prisma.environmentalReport.count({
      where: {
        status: 'active',
        severity: 'critical'
      }
    });

    res.json({
      success: true,
      statistics: {
        totalReports,
        activeReports,
        resolvedReports,
        criticalReports,
        totalSMSSent,
        recentReports24h: recentReports,
        criticalActiveReports
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

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const r = parseFloat(radius);

    const sqlQuery = `
      SELECT r.*, (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude)))) AS distance 
      FROM "EnvironmentalReport" r
      WHERE (6371 * acos(cos(radians($1)) * cos(radians(r.latitude)) * cos(radians(r.longitude) - radians($2)) + sin(radians($1)) * sin(radians(r.latitude)))) <= $3
      ORDER BY distance ASC
      LIMIT $4
    `;

    const dbReports = await prisma._runQuery(sqlQuery, [latitude, longitude, r, parseInt(limit)]);
    
    res.json({
      success: true,
      reports: dbReports.rows.map(nestReportData),
      count: dbReports.rows.length
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

// Send SMS alerts using SMS service (mock coordinates format mapping)
async function sendSMSAlerts(report, customMessage = null, urgentAlert = false) {
  try {
    const radius = report.smsRadius;
    
    // Find recipients within radius using the coordinates from the report
    const recipients = await smsService.findRecipientsInRadius(
      report.latitude,
      report.longitude,
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

    // Adapt flat report to old model format for smsService
    const mockMongooseReport = {
      _id: report.id,
      title: report.title,
      severity: report.severity,
      reportType: report.reportType,
      coordinates: {
        lat: report.latitude,
        lng: report.longitude
      }
    };

    // Send emergency alerts
    const results = await smsService.sendEmergencyAlert(mockMongooseReport, recipients, customMessage);
    return results;

  } catch (error) {
    console.error('SMS alert sending error:', error);
    throw error;
  }
}

module.exports = router;
