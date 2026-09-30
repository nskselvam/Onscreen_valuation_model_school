const express = require('express');
const router = express.Router();
const quantitativeReportController = require('../controller/quantitativeReportController');

router.get('/test-codes', quantitativeReportController.getTestCodesForReport);
router.get('/marks/:testCode', quantitativeReportController.getQuantitativeMarksByTestCode);
router.get('/qb-details/:testCode', quantitativeReportController.getQuantitativeQbDetailsByTestCode);
router.get('/subject-stats/:testCode', quantitativeReportController.getSubjectWiseStatsByTestCode);

module.exports = router;
