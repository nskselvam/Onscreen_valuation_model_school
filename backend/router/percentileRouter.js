const express = require('express');
const router = express.Router();
const percentileController = require('../controller/percentileController');
const { protect } = require('../middleware/authMiddleware');

// Get all test codes with districts
router.get('/test-codes-with-districts', percentileController.getAllTestCodesWithDistricts);

// Get percentile status for a test code
router.get('/status/:testCode', percentileController.getPercentileStatus);

// Calculate overall percentiles for a test code
router.post('/calculate-overall', percentileController.calculateOverallPercentiles);

// Calculate district-specific percentiles
router.post('/calculate-district', percentileController.calculateDistrictPercentiles);

// Calculate percentiles for all districts in a test code
router.post('/calculate-all-districts', percentileController.calculateAllDistrictsPercentiles);
// Revoke overall percentiles for a test code
router.post('/revoke-overall', percentileController.revokeOverallPercentiles);

// Revoke district-specific percentiles
router.post('/revoke-district', percentileController.revokeDistrictPercentiles);

// Revoke percentiles for all districts in a test code
router.post('/revoke-all-districts', percentileController.revokeAllDistrictsPercentiles);
module.exports = router;
