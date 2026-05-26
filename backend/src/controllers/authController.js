const { prisma } = require('../lib/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

// Helper to get role permissions
const getRolePermissions = (role) => {
  switch (role) {
    case 'admin':
      return {
        canCreateAlerts: true,
        canAcknowledgeAlerts: true,
        canGenerateReports: true,
        canManageUsers: true,
        canViewDashboard: true,
        canAccessAPI: true
      };
    case 'operator':
      return {
        canCreateAlerts: true,
        canAcknowledgeAlerts: true,
        canGenerateReports: true,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: true
      };
    case 'community_leader':
      return {
        canCreateAlerts: false,
        canAcknowledgeAlerts: false,
        canGenerateReports: true,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: false
      };
    default: // viewer
      return {
        canCreateAlerts: false,
        canAcknowledgeAlerts: false,
        canGenerateReports: true,
        canManageUsers: false,
        canViewDashboard: true,
        canAccessAPI: false
      };
  }
};

// Register User API
const register = async (req, res) => {
  try {
    const { name, email, password, role, organization, department, phone, region } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Prevent privilege escalation on public signup.
    const publicRoles = ['viewer', 'community_leader', 'operator'];
    const userRole = role && publicRoles.includes(role) ? role : 'viewer';
    const permissions = getRolePermissions(userRole);

    // Hash password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL
    const userId = require('crypto').randomUUID();
    const user = await prisma.user.create({
      data: {
        id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: userRole,
        organization: organization || null,
        department: department || null,
        phone: phone || null,
        region: region || null,
        ...permissions,
        loginCount: 1,
        lastLogin: new Date()
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    // Send response (exclude password)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          permissions: {
            canCreateAlerts: user.canCreateAlerts,
            canAcknowledgeAlerts: user.canAcknowledgeAlerts,
            canGenerateReports: user.canGenerateReports,
            canManageUsers: user.canManageUsers,
            canViewDashboard: user.canViewDashboard,
            canAccessAPI: user.canAccessAPI
          },
          profile: {
            organization: user.organization,
            department: user.department,
            phone: user.phone,
            location: { region: user.region }
          },
          createdAt: user.createdAt
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Login User API
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Update last login details
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: (user.loginCount || 0) + 1
      }
    });

    // Send response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          status: updatedUser.status,
          permissions: {
            canCreateAlerts: updatedUser.canCreateAlerts,
            canAcknowledgeAlerts: updatedUser.canAcknowledgeAlerts,
            canGenerateReports: updatedUser.canGenerateReports,
            canManageUsers: updatedUser.canManageUsers,
            canViewDashboard: updatedUser.canViewDashboard,
            canAccessAPI: updatedUser.canAccessAPI
          },
          profile: {
            organization: updatedUser.organization,
            department: updatedUser.department,
            phone: updatedUser.phone,
            location: { region: updatedUser.region }
          },
          lastLogin: updatedUser.lastLogin,
          loginCount: updatedUser.loginCount
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Logout User API
const logout = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  logout
};
