const  router = require('express').Router();
// const { protect } = require('../middleware/authMiddleware');
const {updateRoleDegree} = require('../controller/redisController');

// Remove protect middleware - this endpoint just caches data user already has
router.post('/update-role-degree', updateRoleDegree);

module.exports = router;