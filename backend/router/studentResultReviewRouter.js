const {updateStudentReviewData} = require("../controller/studentResutReviewController");

const express = require('express');
const router = express.Router();

router.put('/update-review-status', updateStudentReviewData);

module.exports = router;