const { prisma } = require('../lib/db');

// Helper to flatten nested Mongoose payloads into relational Postgres columns
const flattenReportData = (data = {}) => {
  const flat = {
    reportId: data.reportId,
    reportType: data.reportType,
    severity: data.severity,
    status: data.status,
    title: data.title,
    description: data.description,
    location: data.location,
    source: data.source,
    visibility: data.visibility,
    followUpRequired: data.followUpRequired,
    priority: data.priority,
    resolvedAt: data.resolvedAt,
    resolvedById: data.resolvedById || data.resolvedBy,
    resolutionNotes: data.resolutionNotes,
    peopleAffected: data.peopleAffected,
    economicImpact: data.economicImpact,
    environmentalImpact: data.environmentalImpact,
    infrastructureImpact: data.infrastructureImpact,
  };

  // Flatten coordinates
  if (data.coordinates) {
    flat.latitude = parseFloat(data.coordinates.lat || data.coordinates.latitude || 0);
    flat.longitude = parseFloat(data.coordinates.lng || data.coordinates.longitude || 0);
  }

  // Flatten contact info
  if (data.contactInfo) {
    flat.contactName = data.contactInfo.name;
    flat.contactPhone = data.contactInfo.phone;
    flat.contactEmail = data.contactInfo.email;
    flat.contactOrganization = data.contactInfo.organization;
  }

  // Flatten weather conditions
  if (data.weatherConditions) {
    flat.windSpeed = data.weatherConditions.windSpeed;
    flat.waveHeight = data.weatherConditions.waveHeight;
    flat.temperature = data.weatherConditions.temperature;
    flat.weatherVisibility = data.weatherConditions.visibility;
    flat.precipitation = data.weatherConditions.precipitation;
    flat.pressure = data.weatherConditions.pressure;
  }

  // Flatten emergency details
  if (data.emergencyDetails) {
    flat.immediateRisk = data.emergencyDetails.immediateRisk;
    flat.affectedArea = data.emergencyDetails.affectedArea;
    flat.estimatedPeople = data.emergencyDetails.estimatedPeople;
    flat.evacuationNeeded = data.emergencyDetails.evacuationNeeded;
    flat.infrastructureDamage = data.emergencyDetails.infrastructureDamage;
  }

  // Flatten notifications preferences
  if (data.notifications) {
    flat.smsRadius = parseFloat(data.notifications.smsRadius || 5);
    flat.urgentAlert = data.notifications.urgentAlert;
    flat.notifyAuthorities = data.notifications.authorities;
    flat.notifyCommunity = data.notifications.community;
  }

  // Remove undefined fields
  Object.keys(flat).forEach(key => {
    if (flat[key] === undefined) {
      delete flat[key];
    }
  });

  return flat;
};

// Helper to restore nested structure for frontend compatibility
const nestReportData = (report) => {
  if (!report) return null;

  return {
    _id: report.id,
    id: report.id,
    reportId: report.reportId,
    reportType: report.reportType,
    severity: report.severity,
    status: report.status,
    title: report.title,
    description: report.description,
    location: report.location,
    coordinates: {
      lat: report.latitude,
      lng: report.longitude
    },
    contactInfo: {
      name: report.contactName,
      phone: report.contactPhone,
      email: report.contactEmail,
      organization: report.contactOrganization
    },
    weatherConditions: {
      windSpeed: report.windSpeed,
      waveHeight: report.waveHeight,
      temperature: report.temperature,
      visibility: report.weatherVisibility,
      precipitation: report.precipitation,
      pressure: report.pressure
    },
    emergencyDetails: {
      immediateRisk: report.immediateRisk,
      affectedArea: report.affectedArea,
      estimatedPeople: report.estimatedPeople,
      evacuationNeeded: report.evacuationNeeded,
      infrastructureDamage: report.infrastructureDamage
    },
    notifications: {
      smsRadius: report.smsRadius,
      urgentAlert: report.urgentAlert,
      authorities: report.notifyAuthorities,
      community: report.notifyCommunity
    },
    smsAlerts: {
      sent: report.smsSent,
      successful: report.smsSuccessful,
      failed: report.smsFailed,
      lastSentAt: report.smsLastSentAt,
      recipients: [] // Recipient tracking details if needed
    },
    verification: {
      verified: report.verified,
      verifiedBy: report.verifiedById,
      verifiedAt: report.verifiedAt,
      verificationNotes: report.verificationNotes
    },
    priority: report.priority,
    tags: report.tags || [],
    source: report.source,
    visibility: report.visibility,
    followUpRequired: report.followUpRequired,
    estimatedImpact: {
      peopleAffected: report.peopleAffected,
      economicImpact: report.economicImpact,
      environmentalImpact: report.environmentalImpact,
      infrastructureImpact: report.infrastructureImpact
    },
    resolvedAt: report.resolvedAt,
    resolvedBy: report.resolvedById,
    resolutionNotes: report.resolutionNotes,
    aiAnalysis: report.aiAnalysis,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt
  };
};

exports.createReport = async (req, res) => {
  try {
    const rawData = req.body || {};
    if (!rawData.reportId) {
      rawData.reportId = `TR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    const flattened = flattenReportData(rawData);
    
    // Set auto-generated id
    flattened.id = require('crypto').randomUUID();

    const report = await prisma.environmentalReport.create({
      data: flattened
    });

    res.status(201).json(nestReportData(report));
  } catch (err) {
    console.error('Error in createReport:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await prisma.environmentalReport.findMany();
    res.json(reports.map(nestReportData));
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await prisma.environmentalReport.findUnique({
      where: { id: req.params.id }
    });
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(nestReportData(report));
  } catch (err) {
    console.error('Error fetching report:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const flattened = flattenReportData(req.body || {});

    const report = await prisma.environmentalReport.update({
      where: { id: req.params.id },
      data: flattened
    });
    
    res.json(nestReportData(report));
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await prisma.environmentalReport.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Error deleting report:', err);
    res.status(500).json({ error: err.message });
  }
};

// Export helpers for routing scripts
exports.flattenReportData = flattenReportData;
exports.nestReportData = nestReportData;
