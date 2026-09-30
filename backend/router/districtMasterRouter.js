const express = require('express');
const router = express.Router();
const districtMasterController = require('../controller/districtMasterController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
// router.use(protect);

// GET all districts with pagination
router.get('/', districtMasterController.getAllDistricts);

// GET district by ID
router.get('/:id', districtMasterController.getDistrictById);

// POST create new district
router.post('/', districtMasterController.createDistrict);

// PUT update district
router.put('/:id', districtMasterController.updateDistrict);

// DELETE district
router.delete('/:id', districtMasterController.deleteDistrict);

module.exports = router;
