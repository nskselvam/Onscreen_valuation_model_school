const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { getValuationCancelData, deleteValuationRecord } = require('../controller/valuationCancelController');

router.get('/data', protect, getValuationCancelData);
router.delete('/delete', protect, deleteValuationRecord);

module.exports = router;
