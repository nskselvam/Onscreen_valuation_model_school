const express = require('express');
const router = express.Router();
const neetDescriptionController = require('../controller/neetDescriptionController');

// Get all NEET field descriptions
router.get('/fieldnames', neetDescriptionController.getAllNeetDescriptions);

module.exports = router;
