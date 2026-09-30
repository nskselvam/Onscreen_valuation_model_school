const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { upload } = require('../utils/fileupload');
const { fetch_Master_Data, upload_Question_Paper_Key, table_data_where, master_Valid_Sections_Cross_Check, master_Data, master_Data_Register, master_Role_Register, generalMasterData, valid_Ip_Register, getUserAttendanceLogs, getUserAttendanceSummary } = require('../controller/commonController');
const { protect ,modalprotect} = require('../middleware/authMiddleware');

// Configure multer for file upload




router.get('/general-master-data', generalMasterData);
router.get('/master-data', protect, master_Data).get('/master-data/:id', protect, master_Data).delete('/master-data/:id', protect, master_Data);
router.post('/master-data-register', protect, master_Data_Register).put('/master-data-register/:id', protect, master_Data_Register);

router.post('/master-role-register', protect, master_Role_Register).put('/master-role-register/:id', protect, master_Role_Register);

router.post('/valid-ip-register', protect, valid_Ip_Register).put('/valid-ip-register/:id', protect, valid_Ip_Register);
router.get('/master-valid-sections-cross-check', protect, master_Valid_Sections_Cross_Check);
router.post('/table_data_where', protect, table_data_where);
router.post('/upload_question_paper_key', protect, upload.array('files', 100), upload_Question_Paper_Key);
router.post('/fetch_master_data', protect, fetch_Master_Data);
router.get('/user-attendance-logs', protect, getUserAttendanceLogs);
router.get('/user-attendance-summary', protect, getUserAttendanceSummary);



module.exports = router