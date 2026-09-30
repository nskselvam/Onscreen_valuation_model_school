const router = require('express').Router();
const {UserLoginStatusDetails,getexaminercrosscheck, getexamienrdetails, getExaminerPassword, ExaminerPasswordReset, getExaminerpassword_details, passwordsend} = require('../controller/examinerController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getExaminerPassword).post('/', ExaminerPasswordReset);
router.get('/password-details', getExaminerpassword_details).post('/password-details', passwordsend);
router.post('/user-details', getexamienrdetails);
router.get('/examiner_check', protect, getexaminercrosscheck);
router.get('/login-status', protect, UserLoginStatusDetails);

module.exports = router;