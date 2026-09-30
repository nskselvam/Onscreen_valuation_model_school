const express = require('express');
const router = express.Router();
const currentAffairsPercentileController = require('../controller/currentAffairsPercentileController');

router.get('/test-codes-with-districts', currentAffairsPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', currentAffairsPercentileController.getPercentileStatus);
router.post('/calculate-overall', currentAffairsPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', currentAffairsPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', currentAffairsPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', currentAffairsPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', currentAffairsPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', currentAffairsPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
