const router = require('express').Router();

const { getAllSubjects, getQuestionPaperBySubcode, QuestionAnswerUpload } = require('../controller/subjectMasterController');
const { protect, modalprotect } = require('../middleware/authMiddleware');
const { upload } = require('../utils/fileupload');

router.get('/', protect, getAllSubjects);
router.post('/question_paper', modalprotect, getQuestionPaperBySubcode);
router.post('/answer_key', modalprotect, getQuestionPaperBySubcode);
router.post('/question_paper_answer_key', modalprotect, upload.single('files'), QuestionAnswerUpload);

module.exports = router;