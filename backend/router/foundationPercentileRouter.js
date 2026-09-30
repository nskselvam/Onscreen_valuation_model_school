const express = require('express');
const router = express.Router();
const foundationPercentileController = require('../controller/foundationPercentileController');

router.get('/test-codes-with-districts', foundationPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', foundationPercentileController.getPercentileStatus);
router.post('/calculate-overall', foundationPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', foundationPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', foundationPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', foundationPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', foundationPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', foundationPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
