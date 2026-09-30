const express = require('express');
const router = express.Router();
const testMasterController = require('../controller/testMasterController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
//router.use(protect);

// Get all test masters with pagination and search
router.get('/all', testMasterController.getAllTestMasters);

// Get test masters ready for image upload
router.get('/for-image-upload', testMasterController.getTestMastersForImageUpload);

// Get test master by ID
router.get('/:id', testMasterController.getTestMasterById);

// Create new test master
router.post('/create', testMasterController.createTestMaster);

// Update test master
router.put('/update/:id', testMasterController.updateTestMaster);

// Delete test master
router.delete('/delete/:id', testMasterController.deleteTestMaster);

// Delete test marks and QB details by test code
router.delete('/delete-marks/:testcode', testMasterController.deleteTestMarksByTestCode);

// Delete district-wise test data
router.delete('/delete-district-data/:testcode', testMasterController.deleteDistrictTestData);

// Toggle district image upload status
router.post('/toggle-district-status', testMasterController.toggleDistrictImageStatus);

module.exports = router;
