const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { checkScanningData } = require('../controller/scanningController');

router.post('/check', protect, checkScanningData);

module.exports = router;
