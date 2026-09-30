const express = require('express');
const router = express.Router();
const spokenEnglishPercentileController = require('../controller/spokenEnglishPercentileController');

router.get('/test-codes-with-districts', spokenEnglishPercentileController.getAllTestCodesWithDistricts);
router.get('/status/:testCode', spokenEnglishPercentileController.getPercentileStatus);
router.post('/calculate-overall', spokenEnglishPercentileController.calculateOverallPercentiles);
router.post('/calculate-district', spokenEnglishPercentileController.calculateDistrictPercentiles);
router.post('/calculate-all-districts', spokenEnglishPercentileController.calculateAllDistrictsPercentiles);
router.post('/revoke-overall', spokenEnglishPercentileController.revokeOverallPercentiles);
router.post('/revoke-district', spokenEnglishPercentileController.revokeDistrictPercentiles);
router.post('/revoke-all-districts', spokenEnglishPercentileController.revokeAllDistrictsPercentiles);

module.exports = router;
