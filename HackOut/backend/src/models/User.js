const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'viewer', 'community_leader'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  profile: {
    organization: String,
    department: String,
    phone: String,
    location: {
      region: String,
      coordinates: {
        latitude: Number,
        longitude: Number
      }
    }
  },
  permissions: {
    canCreateAlerts: { type: Boolean, default: false },
    canAcknowledgeAlerts: { type: Boolean, default: false },
    canGenerateReports: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canViewDashboard: { type: Boolean, default: true },
    canAccessAPI: { type: Boolean, default: false }
  },
  preferences: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    alertTypes: {
      critical: { type: Boolean, default: true },
      warning: { type: Boolean, default: true },
      info: { type: Boolean, default: false }
    },
    dashboardLayout: String,
    timezone: { type: String, default: 'Asia/Kolkata' }
  },
  lastLogin: Date,
  loginCount: { type: Number, default: 0 },
  apiKey: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ apiKey: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

// Set permissions based on role
userSchema.methods.setRolePermissions = function() {
  switch(this.role) {
    case 'admin':
      this.permissions = {
        canCreateAlerts: true,
        canAcknowledgeAlerts: true,
        canGenerateReports: true,
        canManageUsers: true,
        canViewDashboard: true,
        canAccessAPI: true
      };
      break;
    case 'operator':
      this.permissions = {
        canCreateAlerts: true,
        canAcknowledgeAlerts: true,
        canGenerateReports: true,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: true
      };
      break;
    case 'community_leader':
      this.permissions = {
        canCreateAlerts: false,
        canAcknowledgeAlerts: false,
        canGenerateReports: true,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: false
      };
      break;
    default: // viewer
      this.permissions = {
        canCreateAlerts: false,
        canAcknowledgeAlerts: false,
        canGenerateReports: false,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: false
      };
  }
};

module.exports = mongoose.model('User', userSchema);
