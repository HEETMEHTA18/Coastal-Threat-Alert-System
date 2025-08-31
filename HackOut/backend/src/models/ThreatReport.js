const mongoose = require('mongoose');

const ThreatReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['ACTIVE', 'INVESTIGATING', 'RESOLVED'], default: 'ACTIVE' },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
  type: { type: String, enum: ['Severe Weather', 'Coastal Emergency', 'Infrastructure Damage', 'Marine Incident', 'Environmental Hazard'], required: true },
  location: { type: String, required: true },
  reporter: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  organization: { type: String },
  alertRadius: { type: Number },
  smsSent: { type: Number, default: 0 },
  acknowledgedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  media: [{ type: String }],
  weather: {
    windSpeed: Number,
    temperature: Number,
    visibility: Number
  }
});

module.exports = mongoose.model('ThreatReport', ThreatReportSchema);
