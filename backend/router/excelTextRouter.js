const router = require('express').Router();
const { protect, admin,modalprotect } = require('../middleware/authMiddleware');
const { getTableCount,getSubjectCode,exgeneralMasterData ,sampleFileDownload,Image_Check} = require('../controller/excelTextController');

router.post('/',protect, exgeneralMasterData);
router.get('/download',modalprotect, sampleFileDownload);
router.get('/image-check', protect, Image_Check);
router.get('/subject-code', protect, getSubjectCode);
router.get('/table-count',protect, getTableCount);
module.exports = router;