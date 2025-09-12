const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Assuming User model is in models directory

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ctas_development_secret_key';
    this.jwtExpiry = process.env.JWT_EXPIRE || '7d';
  }

  /**
   * Register a new user
   */
async register(userData) {
  try {
    const { name, email, password, role = 'citizen', organization = '' } = userData;

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return {
        status: 'error',
        message: 'User already exists with this email'
      };
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user in MongoDB
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      organization,
      permissions: this.getPermissionsByRole(role),
      createdAt: new Date(),
      lastLogin: null
    });

    // Generate JWT token
    const token = this.generateToken(newUser);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = newUser.toObject();

    return {
      status: 'success',
      user: userWithoutPassword,
      token,
      message: 'User registered successfully'
    };

  } catch (error) {
    return {
      status: 'error',
      message: 'Registration failed',
      error: error.message
    };
  }
}

  /**
   * Login user
   */
  async login(credentials) {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return {
          status: 'error',
          message: 'User not found'
        };
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return {
          status: 'error',
          message: 'Invalid password'
        };
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = this.generateToken(user);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user.toObject();

      return {
        status: 'success',
        user: userWithoutPassword,
        token,
        message: 'Login successful'
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Login failed',
        error: error.message
      };
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      id: user._id || user.id,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.jwtExpiry });
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      const user = this.users.find(u => u.id === decoded.id);
      
      if (!user) {
        return {
          status: 'error',
          message: 'User not found'
        };
      }

      const { password: _, ...userWithoutPassword } = user;
      
      return {
        status: 'success',
        user: userWithoutPassword
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Invalid token',
        error: error.message
      };
    }
  }

  /**
   * Get permissions by role
   */
  getPermissionsByRole(role) {
    const permissions = {
      citizen: ['view_dashboard', 'create_reports', 'view_alerts'],
      official: ['view_dashboard', 'create_reports', 'view_alerts', 'manage_alerts', 'verify_reports'],
      researcher: ['view_dashboard', 'create_reports', 'view_alerts', 'access_raw_data', 'export_data'],
      emergency: ['view_dashboard', 'create_reports', 'view_alerts', 'manage_alerts', 'emergency_broadcast'],
      admin: ['view_dashboard', 'create_reports', 'view_alerts', 'manage_alerts', 'verify_reports', 'access_raw_data', 'export_data', 'emergency_broadcast', 'admin_access']
    };

    return permissions[role] || permissions.citizen;
  }

  /**
   * Get user by ID
   */
  getUserById(userId) {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }
}

module.exports = new AuthService();
