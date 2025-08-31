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

const User = mongoose.model('User', userSchema);

// Reset a user's password
async function resetPassword() {
  try {
    const email = 'heet@gmail.com'; // Change this to the email you want to reset
    const newPassword = 'password123'; // Change this to the new password you want to set
    
    // Find user by email
    const user = await User.findOne({ email: email });
    if (!user) {
      console.log(`User with email ${email} not found`);
      mongoose.connection.close();
      return;
    }
    
    // Set new password (will be hashed by the pre-save hook)
    user.password = newPassword;
    
    // Save user with new password
    await user.save();
    console.log(`Password for ${email} reset successfully`);
    console.log(`New login credentials: email: ${email}, password: ${newPassword}`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

resetPassword();
