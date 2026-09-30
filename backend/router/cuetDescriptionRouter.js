const express = require('express');
const router = express.Router();
const cuetDescriptionController = require('../controller/cuetDescriptionController');

router.get('/fieldnames', cuetDescriptionController.getAllCuetDescriptions);

module.exports = router;
