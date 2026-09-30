const express = require('express');
const router = express.Router();
const cuetReportController = require('../controller/cuetReportController');

router.get('/test-codes', cuetReportController.getTestCodesForReport);
router.get('/marks/:testCode', cuetReportController.getCuetMarksByTestCode);
router.get('/qb-details/:testCode', cuetReportController.getCuetQbDetailsByTestCode);
router.get('/subject-stats/:testCode', cuetReportController.getSubjectWiseStatsByTestCode);
router.get('/question-stats/:testCode', cuetReportController.getQuestionStatisticsByTestCode);

module.exports = router;
