const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  reportType: {
    type: String,
    enum: ['weather', 'coastal', 'infrastructure', 'marine', 'environmental'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'false_alarm'],
    default: 'active'
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  location: {
    type: String,
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    lng: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    }
  },
  contactInfo: {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Invalid phone number format'
      }
    },
    email: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Invalid email format'
      }
    },
    organization: {
      type: String,
      maxlength: 100
    }
  },
  weatherConditions: {
    windSpeed: String,
    waveHeight: String,
    temperature: String,
    visibility: String,
    precipitation: String,
    pressure: String
  },
  emergencyDetails: {
    immediateRisk: {
      type: Boolean,
      default: false
    },
    affectedArea: String,
    estimatedPeople: String,
    evacuationNeeded: {
      type: Boolean,
      default: false
    },
    infrastructureDamage: {
      type: Boolean,
      default: false
    }
  },
  notifications: {
    smsRadius: {
      type: Number,
      min: 1,
      max: 50,
      default: 5
    },
    urgentAlert: {
      type: Boolean,
      default: false
    },
    authorities: {
      type: Boolean,
      default: true
    },
    community: {
      type: Boolean,
      default: true
    }
  },
  media: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  smsAlerts: {
    sent: {
      type: Number,
      default: 0
    },
    successful: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    lastSentAt: Date,
    recipients: [{
      phone: String,
      status: {
        type: String,
        enum: ['sent', 'delivered', 'failed']
      },
      sentAt: Date,
      deliveredAt: Date
    }]
  },
  verification: {
    verified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: Date,
    verificationNotes: String
  },
  responses: [{
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responderType: {
      type: String,
      enum: ['authority', 'emergency_service', 'community_member', 'system']
    },
    message: String,
    action: {
      type: String,
      enum: ['investigating', 'dispatched', 'resolved', 'false_alarm', 'info_request']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  relatedReports: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityReport'
  }],
  priority: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  tags: [String],
  source: {
    type: String,
    enum: ['community', 'authority', 'sensor', 'satellite', 'social_media'],
    default: 'community'
  },
  visibility: {
    type: String,
    enum: ['public', 'authorities_only', 'emergency_only'],
    default: 'public'
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  estimatedImpact: {
    peopleAffected: Number,
    economicImpact: String,
    environmentalImpact: String,
    infrastructureImpact: String
  },
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: String,
  acknowledgedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userType: {
      type: String,
      enum: ['emergency_responder', 'authority', 'community_leader']
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
communityReportSchema.index({ coordinates: '2dsphere' });
communityReportSchema.index({ reportType: 1, severity: 1 });
communityReportSchema.index({ status: 1, createdAt: -1 });
communityReportSchema.index({ location: 'text', title: 'text', description: 'text' });
communityReportSchema.index({ 'contactInfo.phone': 1 });
communityReportSchema.index({ priority: -1, createdAt: -1 });
communityReportSchema.index({ tags: 1 });

// Virtual fields
communityReportSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

communityReportSchema.virtual('totalSMSSent').get(function() {
  return this.smsAlerts.sent;
});

// Methods
communityReportSchema.methods.addSMSAlert = function(phoneNumber, status) {
  this.smsAlerts.recipients.push({
    phone: phoneNumber,
    status: status,
    sentAt: new Date()
  });
  this.smsAlerts.sent += 1;
  if (status === 'sent') {
    this.smsAlerts.successful += 1;
  } else {
    this.smsAlerts.failed += 1;
  }
  this.smsAlerts.lastSentAt = new Date();
  return this.save();
};

communityReportSchema.methods.addResponse = function(responderId, responderType, message, action) {
  this.responses.push({
    responderId,
    responderType,
    message,
    action,
    timestamp: new Date()
  });
  
  // Update status based on action
  if (action === 'resolved') {
    this.status = 'resolved';
    this.resolvedAt = new Date();
    this.resolvedBy = responderId;
  } else if (action === 'investigating') {
    this.status = 'investigating';
  }
  
  return this.save();
};

communityReportSchema.methods.verify = function(verifierId, notes) {
  this.verification.verified = true;
  this.verification.verifiedBy = verifierId;
  this.verification.verifiedAt = new Date();
  this.verification.verificationNotes = notes;
  return this.save();
};

// Static methods
communityReportSchema.statics.findNearby = function(lat, lng, radius = 10) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  });
};

communityReportSchema.statics.findByTimeRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ createdAt: -1 });
};

communityReportSchema.statics.getStatistics = function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        activeReports: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        resolvedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        criticalReports: {
          $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
        },
        totalSMSSent: { $sum: '$smsAlerts.sent' },
        averageResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
};

// Middleware
communityReportSchema.pre('save', function(next) {
  // Auto-generate reportId if not present
  if (!this.reportId) {
    this.reportId = `CR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Set priority based on severity and emergency details
  if (this.severity === 'critical' || this.emergencyDetails.immediateRisk) {
    this.priority = 10;
  } else if (this.severity === 'high' || this.emergencyDetails.evacuationNeeded) {
    this.priority = 8;
  } else if (this.severity === 'medium') {
    this.priority = 5;
  } else {
    this.priority = 3;
  }
  
  // Auto-tag based on report type and conditions
  if (!this.tags || this.tags.length === 0) {
    this.tags = [this.reportType, this.severity];
    
    if (this.emergencyDetails.immediateRisk) this.tags.push('immediate_risk');
    if (this.emergencyDetails.evacuationNeeded) this.tags.push('evacuation');
    if (this.emergencyDetails.infrastructureDamage) this.tags.push('infrastructure');
    if (this.notifications.urgentAlert) this.tags.push('urgent');
  }
  
  next();
});

module.exports = mongoose.model('CommunityReport', communityReportSchema);
