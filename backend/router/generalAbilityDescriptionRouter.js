const express = require('express');
const router = express.Router();
const generalAbilityDescriptionController = require('../controller/generalAbilityDescriptionController');

router.get('/fieldnames', generalAbilityDescriptionController.getAllGeneralAbilityDescriptions);

module.exports = router;