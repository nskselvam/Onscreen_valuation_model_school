const express = require('express');
const router = express.Router();
const humanitiesReportController = require('../controller/humanitiesReportController');

router.get('/test-codes', humanitiesReportController.getTestCodesForReport);
router.get('/marks/:testCode', humanitiesReportController.getHumanitiesMarksByTestCode);
router.get('/qb-details/:testCode', humanitiesReportController.getHumanitiesQbDetailsByTestCode);
router.get('/subject-stats/:testCode', humanitiesReportController.getSubjectWiseStatsByTestCode);

module.exports = router;
