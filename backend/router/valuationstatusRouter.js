const router = require('express').Router();
const {modalprotect,protect} = require('../middleware/authMiddleware');
const {getCampDetailsOverall,getChiefRemarks,PendingReleaseChief,barcodeReversal,paperPendingClear,chiefEvaluationupdateflg, getSubcodeEvaluationStatus,updateExaminerStatus,getValuationPendingDetails,ExaminerRemarksDetails, getValuationCampDetails ,getSubcodeDetails,getExaminerSubjectDetails,getChiefSubjectDetails,submitPendingAssignment} = require('../controller/valuationStatusController');

router.get('/camp-details', protect, getValuationCampDetails);
router.get('/subcode-details', protect, getSubcodeDetails);
router.get('/examiner-subject-details', protect, getExaminerSubjectDetails);
router.get('/chief-subject-details', protect, getChiefSubjectDetails);

router.get('/examiner-remarks', protect, ExaminerRemarksDetails);
router.get('/pending-valuation-details', protect, getValuationPendingDetails);
router.post('/submit-pending-assignment', protect, submitPendingAssignment);
router.put('/update-examiner-status', protect, updateExaminerStatus)
router.get('/subcode_evaluation_status_examiner', protect, getSubcodeEvaluationStatus);
router.post('/chief-evaluation-update-flg', protect,chiefEvaluationupdateflg);
router.post('/pending-paper-clear', protect,paperPendingClear);
router.put('/barcode-reversal', protect, barcodeReversal);
router.post('/pending-release-chief', protect, PendingReleaseChief);
router.get('/chief-remarks', protect, getChiefRemarks);
router.get('/camp-details-overall', protect, getCampDetailsOverall);
module.exports = router;

