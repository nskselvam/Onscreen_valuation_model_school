const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { ValuationShiftExfel,ValuationMovegetdata ,ValuationMoveUpdate} = require('../controller/valuationMoveController');


router.post('/',protect,ValuationShiftExfel)
router.get ('/',protect,ValuationMovegetdata)
router.post('/update',protect,ValuationMoveUpdate)

module.exports = router;