const express = require('express');
const router = express.Router();
const controller = require('../controllers/threatReportController');

router.post('/', controller.createReport);
router.get('/', controller.getReports);
router.get('/:id', controller.getReport);
router.put('/:id', controller.updateReport);
router.delete('/:id', controller.deleteReport);

module.exports = router;
