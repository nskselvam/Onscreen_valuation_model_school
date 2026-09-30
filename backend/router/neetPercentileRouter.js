const express = require('express');
const router = express.Router();
const neetPercentileController = require('../controller/neetPercentileController');
const { protect } = require('../middleware/authMiddleware');

// Get all test codes with districts
router.get('/test-codes-with-districts', neetPercentileController.getAllTestCodesWithDistricts);

// Get percentile status for a test code
router.get('/status/:testCode', neetPercentileController.getPercentileStatus);

// Calculate overall percentiles for a test code
router.post('/calculate-overall', neetPercentileController.calculateOverallPercentiles);

// Calculate district-specific percentiles
router.post('/calculate-district', neetPercentileController.calculateDistrictPercentiles);

// Calculate percentiles for all districts in a test code
router.post('/calculate-all-districts', neetPercentileController.calculateAllDistrictsPercentiles);

// Revoke overall percentiles for a test code
router.post('/revoke-overall', neetPercentileController.revokeOverallPercentiles);

// Revoke district-specific percentiles
router.post('/revoke-district', neetPercentileController.revokeDistrictPercentiles);

// Revoke percentiles for all districts in a test code
router.post('/revoke-all-districts', neetPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
