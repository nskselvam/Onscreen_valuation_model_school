const express = require('express');
const router = express.Router();
const jeeFieldnamesController = require('../controller/jeeFieldnamesController');
const { protect } = require('../middleware/authMiddleware');

// Get all field names
router.get('/fieldnames', jeeFieldnamesController.getAllFieldnames);

module.exports = router;
