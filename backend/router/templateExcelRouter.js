const router = require('express').Router();
const { enrichTemplateRows, calculateStatisticsRows } = require('../controller/templateExcelController');

router.post('/enrich', enrichTemplateRows);
router.post('/statistics', calculateStatisticsRows);

module.exports = router;
