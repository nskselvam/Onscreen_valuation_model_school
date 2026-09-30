const router = require('express').Router();

const { ValuationpendingUpdate,valuation_timing, valuation_Remarks_Malpractice, valuation_marks_preview_data_examiner, valuation_marks_preview_date, subcode_Fetech, valuation_Barcode_Fetch, valuation_Image_Fetch, valuation_Data_Update, examminer_valuation_data_get, valuation_Finalize, examiner_review_data_get, examiner_review_value_data_get, chief_valuation_Barcode_Fetch, valuation_chief_Barcode_Data, evaluator_checkdates, Chief_Review_Data_Update, rejectedByChief,ValuationCheifRemarksGet,ExaminerTotalMarksGet, valuation_Count_Check } = require('../controller/valuation_Examiner');
const { modalprotect ,modalmodalprotect,Redisprotect} = require('../middleware/authMiddleware');

// Define your valuation routes here
router.get('/subcode_section', modalprotect, subcode_Fetech).get('/valuation_barcode', modalprotect, valuation_Barcode_Fetch);
router.get('/valuation_images', modalprotect, valuation_Image_Fetch);
router.post('/valuation_data_update', modalprotect, valuation_Data_Update).post('/examminer_valuation_data_get', modalprotect, examminer_valuation_data_get).post('/valuation_finalize', modalprotect, valuation_Finalize);
router.get('/examiner_review_data', modalprotect, examiner_review_data_get);
router.get('/examiner_review_value_data', modalprotect, examiner_review_value_data_get);
router.get('/valuation_chief', modalprotect, chief_valuation_Barcode_Fetch);
router.get('/valuation_chief_barcode', modalprotect, valuation_chief_Barcode_Data);
router.get('/valuation_marks_preview_date', modalprotect, valuation_marks_preview_date);
router.get('/valuation_marks_preview_data_examiner', modalprotect, valuation_marks_preview_data_examiner);
router.get('/evaluator_checkdates', modalprotect, evaluator_checkdates);
router.post('/valuation_remarks_malpractice', modalprotect, valuation_Remarks_Malpractice);
router.get('/valuation_timing', modalprotect, valuation_timing);
router.post('/Valuation_Chief_Review_Data_Update', modalprotect, Chief_Review_Data_Update);
router.post('/rejected_by_chief', modalprotect, rejectedByChief);
router.get('/valuation_chief_remarks_get', modalprotect, ValuationCheifRemarksGet);
router.post('/pending-update', modalprotect, ValuationpendingUpdate);
router.get('/examiner-total-marks', modalprotect, ExaminerTotalMarksGet);
router.get('/count_check', Redisprotect, valuation_Count_Check);

module.exports = router;