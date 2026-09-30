const router = require('express').Router();
const { registerUser, loginUser,password_reset,passsent_email,logout } = require('../controller/authController');
const { protect, admin } = require('../middleware/authMiddleware');
router.post('/register', registerUser);
router.route('/login').post(loginUser);
router.post("/password_reset", password_reset);
router.post("/email-sent", passsent_email);
router.post("/logout", logout);
module.exports = router

