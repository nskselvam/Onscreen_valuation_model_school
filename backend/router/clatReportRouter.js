const router = require('express').Router();
const controller = require('../controller/clatReportController');

router.get('/test-codes', controller.getTestCodesForReport);
router.get('/marks/:testCode', controller.getClatMarksByTestCode);
router.get('/qb-details/:testCode', controller.getClatQbDetailsByTestCode);

module.exports = router;
