const router = require('express').Router();
const { 
    getCommonUserData, 
    getValidQbsBySubcode, 
    getValidSectionsBySubcode,
    addSubject,
    updateSubject,
    deleteSubject,
    addValidQuestion,
    updateValidQuestion,
    deleteValidQuestion,
    addValidSection,
    updateValidSection,
    deleteValidSection
} = require('../controller/getDataCommon')
const { protect } = require('../middleware/authMiddleware');

router.get('/common-data',protect, getCommonUserData);
router.post('/valid-qbs',protect, getValidQbsBySubcode);
router.post('/valid-sections',protect, getValidSectionsBySubcode);

// Subject CRUD routes
router.post('/subject', protect, addSubject);
router.put('/subject/:id', protect, updateSubject);
router.delete('/subject/:id', protect, deleteSubject);

// Valid Questions CRUD routes
router.post('/valid-question', protect, addValidQuestion);
router.put('/valid-question/:id', protect, updateValidQuestion);
router.delete('/valid-question/:id', protect, deleteValidQuestion);

// Valid Sections CRUD routes
router.post('/valid-section', protect, addValidSection);
router.put('/valid-section/:id', protect, updateValidSection);
router.delete('/valid-section/:id', protect, deleteValidSection);

module.exports = router;