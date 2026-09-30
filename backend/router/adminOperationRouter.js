const router = require('express').Router();
const {
    getAllUserRollData, 
    getAllUserDataError,
    getAllUserData,
    getLoggedInUsers,
    createUserData,
    deleteUserData,
    addUpdateSubjectData,
    updateGeneralBioData,
    updateFacultyRawFields,
    createNavbarItem,
    updateNavbarItem,
    deleteNavbarItem,
    getAllRollMasters,
    createRollMaster,
    updateRollMaster_Final,
    deleteRollMaster,
    updateUserRollAdmin,
    UpdaterollMaster,
    resetUserPassword,
    resetAllLoginStatus
} = require('../controller/adminOperationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/all_user_data', protect, getAllUserData);
router.get('/logged_in_users', protect, getLoggedInUsers);
router.post('/create_user_data', protect, createUserData);
router.delete('/delete_user_data', protect, deleteUserData);
router.post('/add_update_subject_data', protect, addUpdateSubjectData);
router.post('/update_general_bio_data', protect, updateGeneralBioData);
router.get('/all_user_data_error', protect, getAllUserDataError);
router.post('/update_faculty_raw_fields', protect, updateFacultyRawFields);
router.post('/get_all_user_roll_data', protect, getAllUserRollData);
router.post('/create_navbar_item', protect, createNavbarItem);
router.post('/update_navbar_item', protect, updateNavbarItem);
router.post('/delete_navbar_item', protect, deleteNavbarItem);
router.post('/get_all_roll_masters', protect, getAllRollMasters);
router.post('/create_roll_master', protect, createRollMaster);
router.post('/update_roll_master', protect, updateRollMaster_Final);
router.post('/delete_roll_master', protect, deleteRollMaster);
router.post('/update_user_roll_admin', protect, updateUserRollAdmin);
router.post('/updateRollMaster', protect, UpdaterollMaster);
router.post('/reset_user_password', protect, resetUserPassword);
router.post('/reset_all_login_status', protect, resetAllLoginStatus);

module.exports = router;