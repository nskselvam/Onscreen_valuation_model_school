const express = require('express');
const router = express.Router();
const humanitiesPercentileController = require('../controller/humanitiesPercentileController');

router.get('/test-codes-with-districts', humanitiesPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', humanitiesPercentileController.getPercentileStatus);
router.post('/calculate-overall', humanitiesPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', humanitiesPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', humanitiesPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', humanitiesPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', humanitiesPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', humanitiesPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
