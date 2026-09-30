const router = require('express').Router();
const { protect, admin,Redisprotect } = require('../middleware/authMiddleware');
const { valid_Ip_Data,valid_ip_update,valid_ip_add } = require('../controller/ipConfigController');

router.get('/ip-data', Redisprotect, valid_Ip_Data);
router.post('/ip-update', protect, valid_ip_update);
router.post('/ip-add', protect, valid_ip_add);

module.exports = router