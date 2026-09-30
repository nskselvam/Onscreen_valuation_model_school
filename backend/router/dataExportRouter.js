const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getExportData } = require('../controller/dataExportController');

router.get('/export', protect, getExportData);

module.exports = router;
