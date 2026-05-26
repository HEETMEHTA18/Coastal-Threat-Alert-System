const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/db');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

// Verify JWT Token Middleware
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, getJwtSecret());
    
    // Find user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token - user not found'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: `Account is ${user.status}. Please contact administrator.`
      });
    }

    // Add user info and permissions to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: {
        canCreateAlerts: user.canCreateAlerts,
        canAcknowledgeAlerts: user.canAcknowledgeAlerts,
        canGenerateReports: user.canGenerateReports,
        canManageUsers: user.canManageUsers,
        canViewDashboard: user.canViewDashboard,
        canAccessAPI: user.canAccessAPI
      }
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token has expired'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication'
    });
  }
};

// Check if user has specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!req.user.permissions[permission]) {
      return res.status(403).json({
        status: 'error',
        message: `Permission denied. Required permission: ${permission}`
      });
    }

    next();
  };
};

// Check if user has specific role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (token) {
      const decoded = jwt.verify(token, getJwtSecret());
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      
      if (user && user.status === 'active') {
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          permissions: {
            canCreateAlerts: user.canCreateAlerts,
            canAcknowledgeAlerts: user.canAcknowledgeAlerts,
            canGenerateReports: user.canGenerateReports,
            canManageUsers: user.canManageUsers,
            canViewDashboard: user.canViewDashboard,
            canAccessAPI: user.canAccessAPI
          }
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  optionalAuth
};
