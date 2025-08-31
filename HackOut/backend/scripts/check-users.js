require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected: ', process.env.MONGODB_URI.split('@')[1].split('/')[0]))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User schema (simplified version matching your actual User model)
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  status: String,
  permissions: Object,
  profile: Object,
  lastLogin: Date,
  loginCount: Number
}, { timestamps: true });

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

// Set role-based permissions
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

const User = mongoose.model('User', userSchema);

// Check if any users exist
async function checkAndCreateUser() {
  try {
    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`Found ${userCount} users in the database`);
    
    if (userCount === 0) {
      console.log('No users found. Creating a test user...');
      
      // Create admin user
      const admin = new User({
        name: 'Admin User',
        email: 'admin@ctas.com',
        password: 'admin123',  // This will be hashed by the pre-save hook
        role: 'admin',
        status: 'active'
      });
      
      // Set permissions based on role
      admin.setRolePermissions();
      
      // Save user
      await admin.save();
      console.log('Admin user created successfully');
      console.log('Login credentials: email: admin@ctas.com, password: admin123');
      
      // Create a regular user too
      const user = new User({
        name: 'Test User',
        email: 'user@ctas.com',
        password: 'user123',  // This will be hashed by the pre-save hook
        role: 'viewer',
        status: 'active'
      });
      
      // Set permissions based on role
      user.setRolePermissions();
      
      // Save user
      await user.save();
      console.log('Regular user created successfully');
      console.log('Login credentials: email: user@ctas.com, password: user123');
    } else {
      // List all users
      const users = await User.find({}, 'name email role status');
      console.log('Existing users:');
      users.forEach(user => {
        console.log(`- ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
      });
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

checkAndCreateUser();
