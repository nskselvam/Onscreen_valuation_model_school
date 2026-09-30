const router = require('express').Router();
const { getBlCoPoData, getSubcode } = require('../controller/blcopoController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/get-blcopo-data', getBlCoPoData);
router.get('/getSubcode', getSubcode);

module.exports = router;
