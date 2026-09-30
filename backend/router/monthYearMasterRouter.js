const router = require('express').Router();
const { getAllMonthYears, monthYearRegister, deleteMonthYear } = require('../controller/monthYearMasterController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getAllMonthYears);
router.post('/', protect, monthYearRegister);
router.put('/:id', protect, monthYearRegister);
router.delete('/:id', protect, deleteMonthYear);

module.exports = router;
