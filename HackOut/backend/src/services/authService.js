const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'ctas_development_secret_key';
    this.jwtExpiry = process.env.JWT_EXPIRE || '7d';
    
    // Mock user database (in production, this would be MongoDB)
    this.users = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@ctas.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'admin',
        organization: 'CTAS Development',
        permissions: ['view_dashboard', 'create_reports', 'view_alerts', 'admin_access'],
        createdAt: new Date('2024-01-01'),
        lastLogin: null
      },
      {
        id: 2,
        name: 'Demo User',
        email: 'demo@example.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'citizen',
        organization: 'Community',
        permissions: ['view_dashboard', 'create_reports', 'view_alerts'],
        createdAt: new Date('2024-01-01'),
        lastLogin: null
      }
    ];
  }

  /**
   * Register a new user
   */
  async register(userData) {
    try {
      const { name, email, password, role = 'citizen', organization = '' } = userData;

      // Check if user already exists
      const existingUser = this.users.find(user => user.email === email);
      if (existingUser) {
        return {
          status: 'error',
          message: 'User already exists with this email'
        };
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = {
        id: this.users.length + 1,
        name,
        email,
        password: hashedPassword,
        role,
        organization,
        permissions: this.getPermissionsByRole(role),
        createdAt: new Date(),
        lastLogin: null
      };

      // Add to mock database
      this.users.push(newUser);

      // Generate JWT token
      const token = this.generateToken(newUser);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = newUser;

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
      const user = this.users.find(u => u.email === email);
      if (!user) {
        return {
          status: 'error',
          message: 'Invalid email or password'
        };
      }

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return {
          status: 'error',
          message: 'Invalid email or password'
        };
      }

      // Update last login
      user.lastLogin = new Date();

      // Generate JWT token
      const token = this.generateToken(user);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;

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
      id: user.id,
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
