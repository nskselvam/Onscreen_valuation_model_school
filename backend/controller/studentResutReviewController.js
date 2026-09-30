const AppError = require('../utils/appError');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const db = require('../db/models');
const path = require('path');
const fs = require('fs');

const updateStudentReviewData = asyncHandler(async (req, res, next) => {
    const {reviewStatus,Dummy_NO,SubjectCode} = req.query || {};


    console.log("Received updateStudentReviewData request with parameters:", {
        reviewStatus,
        Dummy_NO,
        SubjectCode
    });

    if (!reviewStatus || !Dummy_NO || !SubjectCode) {
        return next(new AppError('reviewStatus, Dummy_NO, and SubjectCode are required', 400));
    }

    await db.student_result_data.update(
        { reviewStatus },
        { where: { Dummy_NO, SubjectCode } }
    );

    res.status(200).json({
        success: true,
        message: 'Review status updated successfully',
    });
});

module.exports = {
    updateStudentReviewData
};

