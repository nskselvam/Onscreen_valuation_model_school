const express = require('express');
const router = express.Router();
const currentAffairsReportController = require('../controller/currentAffairsReportController');

router.get('/test-codes', currentAffairsReportController.getTestCodesForReport);
router.get('/marks/:testCode', currentAffairsReportController.getCurrentAffairsMarksByTestCode);
router.get('/qb-details/:testCode', currentAffairsReportController.getCurrentAffairsQbDetailsByTestCode);
router.get('/subject-stats/:testCode', currentAffairsReportController.getSubjectWiseStatsByTestCode);

module.exports = router;
