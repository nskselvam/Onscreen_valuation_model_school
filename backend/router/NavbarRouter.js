const router = require('express').Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { NavBarHeader } = require('../controller/NavbarController');

router.get('/dataNav', protect, NavBarHeader);

module.exports = router