const express = require('express');
const router = express.Router();
const cuetPercentileController = require('../controller/cuetPercentileController');

router.get('/test-codes-with-districts', cuetPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', cuetPercentileController.getPercentileStatus);
router.post('/calculate-overall', cuetPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', cuetPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', cuetPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', cuetPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', cuetPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', cuetPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
