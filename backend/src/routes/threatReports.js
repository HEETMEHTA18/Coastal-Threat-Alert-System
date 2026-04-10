const express = require('express');
const router = express.Router();
const controller = require('../controllers/threatReportController');
const { authenticateToken, requirePermission, requireRole } = require('../middleware/auth');

router.post('/', authenticateToken, requirePermission('canCreateAlerts'), controller.createReport);
router.get('/', controller.getReports);
router.get('/:id', controller.getReport);
router.put('/:id', authenticateToken, requirePermission('canCreateAlerts'), controller.updateReport);
router.delete('/:id', authenticateToken, requireRole('admin', 'operator'), controller.deleteReport);

module.exports = router;
