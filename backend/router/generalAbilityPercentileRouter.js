const express = require('express');
const router = express.Router();
const generalAbilityPercentileController = require('../controller/generalAbilityPercentileController');

router.get('/test-codes-with-districts', generalAbilityPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', generalAbilityPercentileController.getPercentileStatus);
router.post('/calculate-overall', generalAbilityPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', generalAbilityPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', generalAbilityPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', generalAbilityPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', generalAbilityPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', generalAbilityPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;