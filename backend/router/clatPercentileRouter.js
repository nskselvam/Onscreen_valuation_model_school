const express = require('express');
const controller = require('../controller/clatPercentileController');

const router = express.Router();

router.get('/test-codes-with-districts', controller.getAllTestCodesWithDistricts);
router.post('/calculate-overall', controller.calculateOverallPercentiles);
router.post('/calculate-district', controller.calculateDistrictPercentiles);
router.post('/calculate-all-districts', controller.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', controller.revokeOverallPercentiles);
router.post('/revoke-district', controller.revokeDistrictPercentiles);
router.post('/revoke-all-districts', controller.revokeAllDistrictsPercentiles);

module.exports = router;
