const express = require('express');
const router = express.Router();
const spokenEnglishReportController = require('../controller/spokenEnglishReportController');

router.get('/test-codes', spokenEnglishReportController.getTestCodesForReport);
router.get('/marks/:testCode', spokenEnglishReportController.getSpokenEnglishMarksByTestCode);
router.get('/qb-details/:testCode', spokenEnglishReportController.getSpokenEnglishQbDetailsByTestCode);
router.get('/subject-stats/:testCode', spokenEnglishReportController.getSubjectWiseStatsByTestCode);

module.exports = router;
