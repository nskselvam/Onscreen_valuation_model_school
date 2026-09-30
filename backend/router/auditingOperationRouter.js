const router = require('express').Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getSubjectCode } = require('../controller/auditingOperationController');

router.get('/auditing-subjectcode/getSubcode/:userId', protect, getSubjectCode);

module.exports = router;