const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getAllDataAllowances,
  getDataAllowanceById,
  createDataAllowance,
  updateDataAllowance,
  deleteDataAllowance,
  getDataAllowanceByDepcode
} = require('../controller/dataAllowanceController');

// Routes
router.route('/')
  .get(protect, getAllDataAllowances)
  .post(protect, createDataAllowance);

router.route('/:id')
  .get(protect, getDataAllowanceById)
  .put(protect, updateDataAllowance)
  .delete(protect, deleteDataAllowance);

router.get('/department/:depcode', protect, getDataAllowanceByDepcode);

module.exports = router;
