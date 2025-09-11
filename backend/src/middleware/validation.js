const { body } = require('express-validator');

// Register validation
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),

  body('role')
    .optional()
    .isIn(['admin', 'operator', 'viewer', 'community_leader'])
    .withMessage('Role must be one of: admin, operator, viewer, community_leader'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name cannot exceed 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),

  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region name cannot exceed 100 characters')
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Update profile validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('organization')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Organization name cannot exceed 100 characters'),

  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department name cannot exceed 100 characters'),

  body('phone')
    .optional()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please provide a valid phone number'),

  body('region')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Region name cannot exceed 100 characters'),

  body('preferences.emailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be a boolean'),

  body('preferences.smsNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications preference must be a boolean'),

  body('preferences.timezone')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Timezone cannot exceed 50 characters')
];

// Change password validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
};
