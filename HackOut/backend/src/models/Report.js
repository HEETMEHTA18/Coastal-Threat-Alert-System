const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['threat-analysis', 'ecosystem-health', 'community-impact', 'environmental-monitoring'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  location: {
    name: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    radius: Number // in kilometers
  },
  parameters: {
    includeAlerts: { type: Boolean, default: true },
    includeSensorData: { type: Boolean, default: true },
    includeSatelliteData: { type: Boolean, default: true },
    includeWeatherData: { type: Boolean, default: true },
    includeCommunityCounts: { type: Boolean, default: true }
  },
  data: {
    alertsSummary: {
      total: Number,
      byType: {
        critical: Number,
        warning: Number,
        info: Number
      },
      byStatus: {
        active: Number,
        resolved: Number,
        investigating: Number
      }
    },
    environmentalMetrics: {
      averageWaveHeight: Number,
      maxWindSpeed: Number,
      temperatureRange: {
        min: Number,
        max: Number,
        average: Number
      },
      humidityAverage: Number
    },
    communityImpact: {
      totalAffected: Number,
      responseTime: {
        average: Number,
        median: Number
      },
      acknowledgmentRate: Number
    }
  },
  fileInfo: {
    filename: String,
    size: Number,
    format: {
      type: String,
      enum: ['pdf', 'excel', 'json'],
      default: 'pdf'
    },
    downloadUrl: String
  },
  processingTime: Number, // in milliseconds
  error: String
}, {
  timestamps: true
});

// Indexes
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ createdAt: -1 });
reportSchema.index({ 'location.coordinates': '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);
