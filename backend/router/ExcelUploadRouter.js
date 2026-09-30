const router = require('express').Router();
const { getAllTypeExam,uploadExcel } = require('../controller/ExcelUploadController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const { downloadTemplate, createFoldersFromExcel } = require('../controller/answerSheetFolderController');

const workbookUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 5 * 1024 * 1024 },
	fileFilter: (req, file, callback) => callback(null, /\.xlsx$/i.test(file.originalname)),
}).single('file');

router.get('/get_all_type_exam', getAllTypeExam);
router.post('/upload_excel', uploadExcel);
router.get('/answer-sheet-folders/template', downloadTemplate);
router.post('/answer-sheet-folders', (req, res, next) => {
	workbookUpload(req, res, (error) => {
		if (error) return res.status(400).json({ message: error.message });
		createFoldersFromExcel(req, res, next);
	});
});

module.exports = router;