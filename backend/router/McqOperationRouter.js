const router = require('express').Router();
const { McqMasterDataUpdate,getMcqDataBySubcode,McqDataUpdate,getMcqDataBySubcodeFromTheBack,updateMcqDataFinal,reverteMcqDataFinal,EvaluatorData } = require('../controller/McqOperationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/mcq_master_data_update', protect, McqMasterDataUpdate);
router.get('/get_mcq_data_by_subcode', protect, getMcqDataBySubcode);
router.post('/mcq_data_update', protect, McqDataUpdate);
router.get('/get_mcq_data_by_subcode_from_back', protect, getMcqDataBySubcodeFromTheBack);
router.post('/update_mcq_data_final', protect, updateMcqDataFinal);
router.post('/revert_mcq_data_final', protect, reverteMcqDataFinal);
router.get('/evaluator_data', protect, EvaluatorData);


module.exports = router;