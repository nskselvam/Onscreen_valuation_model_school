const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const {
	getThiyagarayaReviewData,
	getThiyagarayaReviewMainData,
	updateThiyagarayaReviewDecision,
	getThiyagarayaReviewRemark,
	getThiyagarayaStudentRemarks,
	getThiyagarayaCandidateRemarksByDummy,
	saveThiyagarayaReviewRemark,
} = require("../controller/thiyagarayaReviewController");

router.get("/", protect, getThiyagarayaReviewData);
router.post("/", protect, getThiyagarayaReviewData);
router.post("/review-main", protect, getThiyagarayaReviewMainData);
router.post("/decision", protect, updateThiyagarayaReviewDecision);
router.post("/remarks/get", protect, getThiyagarayaReviewRemark);
router.post("/student-remarks", protect, getThiyagarayaStudentRemarks);
router.post("/candidate-remarks/by-dummy", protect, getThiyagarayaCandidateRemarksByDummy);
router.post("/remarks", protect, saveThiyagarayaReviewRemark);

module.exports = router;
