const router = require('express').Router();
const {resetUserPassword,passwordReset, getUserDetailsInsert, upDataMasterDataController, getUserDetailsOriginal,generateRank ,vacancyAllot} = require('../controller/upDataMasterDataController');
const { protect } = require('../middleware/authMiddleware');

router.get('/masterdata', protect,upDataMasterDataController);
router.get('/user-details-original',protect, getUserDetailsOriginal);
router.get('/user-details-insert',getUserDetailsInsert);
router.get('/generateRank', protect, generateRank);
router.get('/vacancyAllot', protect, vacancyAllot);
router.get('/passwordReset',  passwordReset);
router.get('/mailsentPasswordReset', resetUserPassword);

module.exports = router;