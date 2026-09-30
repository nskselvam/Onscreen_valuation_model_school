const express = require('express');
const router = express.Router();
const foundationReportController = require('../controller/foundationReportController');

router.get('/test-codes', foundationReportController.getTestCodesForReport);
router.get('/marks/:testCode', foundationReportController.getFoundationMarksByTestCode);
router.get('/qb-details/:testCode', foundationReportController.getFoundationQbDetailsByTestCode);
router.get('/subject-stats/:testCode', foundationReportController.getSubjectWiseStatsByTestCode);

module.exports = router;
