// Use the CommunityReport model (where your 13 reports are stored in 'communityreports' collection)
const Report = require('../models/CommunityReport');

const ALLOWED_CREATE_FIELDS = [
  'reportId',
  'reportType',
  'severity',
  'status',
  'title',
  'description',
  'location',
  'coordinates',
  'contactInfo',
  'weatherConditions',
  'emergencyDetails',
  'notifications',
  'source',
  'visibility'
];

const ALLOWED_UPDATE_FIELDS = [
  'severity',
  'status',
  'title',
  'description',
  'location',
  'coordinates',
  'weatherConditions',
  'emergencyDetails',
  'notifications',
  'visibility',
  'followUpRequired',
  'resolutionNotes'
];

const pickAllowedFields = (payload, allowedFields) => {
  return allowedFields.reduce((acc, field) => {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      acc[field] = payload[field];
    }
    return acc;
  }, {});
};

exports.createReport = async (req, res) => {
  try {
    const safePayload = pickAllowedFields(req.body || {}, ALLOWED_CREATE_FIELDS);
    const report = new Report(safePayload);
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }); // Sort by newest first
    console.log(`Found ${reports.length} reports in database`);
    res.json(reports);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateReport = async (req, res) => {
  try {
    const safeUpdates = pickAllowedFields(req.body || {}, ALLOWED_UPDATE_FIELDS);

    if (Object.keys(safeUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided for update' });
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    );
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
