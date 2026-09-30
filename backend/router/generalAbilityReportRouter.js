const express = require('express');
const router = express.Router();
const generalAbilityReportController = require('../controller/generalAbilityReportController');

router.get('/test-codes', generalAbilityReportController.getTestCodesForReport);
router.get('/marks/:testCode', generalAbilityReportController.getGeneralAbilityMarksByTestCode);
router.get('/qb-details/:testCode', generalAbilityReportController.getGeneralAbilityQbDetailsByTestCode);
router.get('/subject-stats/:testCode', generalAbilityReportController.getSubjectWiseStatsByTestCode);

module.exports = router;