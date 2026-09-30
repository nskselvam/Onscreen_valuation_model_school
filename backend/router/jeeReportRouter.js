const express = require('express');
const router = express.Router();
const jeeReportController = require('../controller/jeeReportController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication

// Get test codes for report
router.get('/test-codes', jeeReportController.getTestCodesForReport);

// Get JEE marks by test code
router.get('/marks/:testCode', jeeReportController.getJeeMarksByTestCode);

// Get JEE QB details by test code
router.get('/qb-details/:testCode', jeeReportController.getJeeQbDetailsByTestCode);

// Get subject-wise statistics by test code
router.get('/subject-stats/:testCode', jeeReportController.getSubjectWiseStatsByTestCode);

// Get question statistics by test code
router.get('/question-stats/:testCode', jeeReportController.getQuestionStatisticsByTestCode);

module.exports = router;
