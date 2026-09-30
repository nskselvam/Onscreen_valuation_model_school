const express = require('express');
const router = express.Router();
const neetReportController = require('../controller/neetReportController');
const { protect } = require('../middleware/authMiddleware');

// Get NEET test codes for report
router.get('/test-codes', neetReportController.getTestCodesForReport);

// Get NEET marks by test code
router.get('/marks/:testCode', neetReportController.getNeetMarksByTestCode);

// Get NEET QB details by test code
router.get('/qb-details/:testCode', neetReportController.getNeetQbDetailsByTestCode);

// Get subject-wise statistics by test code
router.get('/subject-stats/:testCode', neetReportController.getSubjectWiseStatsByTestCode);

// Get NEET medium question statistics by test code
router.get('/question-stats/:testCode', neetReportController.getQuestionStatisticsByTestCode);

module.exports = router;
