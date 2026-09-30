const express = require('express');
const router = express.Router();
const imageUploadController = require('../controller/imageUploadController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
//router.use(protect);

// Upload images for a test
router.post('/upload', imageUploadController.uploadTestImages);

// Get images for a test
router.get('/:testcode', imageUploadController.getTestImages);

// Get image counts by district for a test
router.get('/counts/:testcode', imageUploadController.getImageCountsByDistrict);

// Delete an image
router.delete('/:id', imageUploadController.deleteTestImage);

// Delete all images for a test and district
router.post('/delete-all', imageUploadController.deleteAllTestImages);

// Confirm and update image upload status
router.post('/confirm', imageUploadController.confirmImageUpload);

module.exports = router;
