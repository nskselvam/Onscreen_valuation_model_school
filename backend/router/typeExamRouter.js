const express = require('express');
const router = express.Router();
const typeExamController = require('../controller/typeExamController');
const { protect } = require('../middleware/authMiddleware');

// All routes require authentication
//router.use(protect);

// Get all type exams with pagination and search
router.get('/all', typeExamController.getAllTypeExams);

// Get next serial number
router.get('/next-serial', typeExamController.getNextSerialNumber);

// Get type exam by ID
router.get('/:id', typeExamController.getTypeExamById);

// Create new type exam
router.post('/create', typeExamController.createTypeExam);

// Update type exam
router.put('/update/:id', typeExamController.updateTypeExam);

// Delete type exam
router.delete('/delete/:id', typeExamController.deleteTypeExam);

module.exports = router;
