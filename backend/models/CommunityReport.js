const mongoose = require('mongoose');

const CommunityReportSchema = new mongoose.Schema({
  reportId: String,
  reportType: String,
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'investigating', 'closed'],
    default: 'active'
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  coordinates: {
    lat: Number,
    lng: Number
  },
  contactInfo: {
    name: String,
    phone: String,
    email: String,
    organization: String
  },
  weatherConditions: String,
  emergencyDetails: String,
  notifications: [String],
  smsAlerts: Boolean,
  verification: {
    verified: Boolean,
    verifiedBy: String,
    verifiedAt: Date
  },
  relatedReports: [String],
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  tags: [String],
  source: String,
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted'],
    default: 'public'
  },
  followUpRequired: Boolean,
  media: [String],
  responses: [String],
  acknowledgedBy: [String]
}, {
  timestamps: true, // This adds createdAt and updatedAt
  collection: 'communityreports' // Explicitly set the collection name
});

// Prevent OverwriteModelError by checking if model already exists
module.exports = mongoose.models.CommunityReport || mongoose.model('CommunityReport', CommunityReportSchema);