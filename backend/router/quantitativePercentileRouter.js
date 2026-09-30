const express = require('express');
const router = express.Router();
const quantitativePercentileController = require('../controller/quantitativePercentileController');

router.get('/test-codes-with-districts', quantitativePercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', quantitativePercentileController.getPercentileStatus);
router.post('/calculate-overall', quantitativePercentileController.calculateOverallPercentiles);
router.post('/calculate-district', quantitativePercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', quantitativePercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', quantitativePercentileController.revokeOverallPercentiles);
router.post('/revoke-district', quantitativePercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', quantitativePercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
