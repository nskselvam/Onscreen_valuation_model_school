const AppError = require('../utils/appError');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const db = require('../db/models');
const path = require('path');
const fs = require('fs');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const getAllSubjects = asyncHandler(async (req, res, next) => {
    const subjects = await db.sub_master.findAll({

        order: [['Subcode', 'ASC']]
    });

    res.status(200).json({
        success: true,
        data: subjects
    });
});
const getQuestionPaperBySubcode = asyncHandler(async (req, res, next) => {
    
    if (!req.body || typeof req.body !== 'object') {
        return next(new AppError('Request body is missing or invalid', 400));
    }
    
    const { subcode, testcode, Eva_Mon_Year, uploadType } = req.body || {};


    if (!subcode || !Eva_Mon_Year) {
        return next(new AppError('subcode and Eva_Mon_Year are required', 400));
    }

    if (!['question_paper', 'answer_key'].includes(uploadType)) {
        return next(new AppError('Invalid upload type specified', 400));
    }

    const subjectMappings = await db.sub_master.findAll({ where: { Subcode: subcode } });
    const subject = testcode
        ? subjectMappings.find((item) => item.testcode === testcode)
        : subjectMappings.length === 1 ? subjectMappings[0] : null;
    if (!subject && subjectMappings.length > 1 && !testcode) {
        return next(new AppError(`testcode is required for subject ${subcode}`, 400));
    }
    if (!subject?.testcode) {
        return next(new AppError(`Test code is not configured for subject ${subcode}`, 404));
    }

    const objectFolder = uploadType === 'question_paper' ? 'qbs' : 'ans';
    const objectKey = `qbs_and_answerkey/${Eva_Mon_Year}/${subject.testcode}/${objectFolder}/${subcode}/${uploadType}.pdf`;

    let s3Response;
    try {
        s3Response = await s3.send(new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: objectKey,
        }));
    } catch (error) {
        if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
            const fileType = uploadType === 'answer_key' ? 'Answer key' : 'Question paper';
            return next(new AppError(`${fileType} not uploaded yet for ${subcode} (${Eva_Mon_Year})`, 404));
        }
        return next(new AppError(`Failed to fetch ${uploadType} from storage: ${error.message}`, 502));
    }

    res.setHeader('Content-Type', s3Response.ContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${subcode}-${uploadType}.pdf"`);
    if (s3Response.ContentLength) res.setHeader('Content-Length', s3Response.ContentLength);
    s3Response.Body.pipe(res);
});

const QuestionAnswerUpload = asyncHandler(async (req, res, next) => {
    const { subcode, Eva_Mon_Year, uploadType, testcode } = req.body;
    const file = req.file;

    if (!subcode || !Eva_Mon_Year || !testcode || !file) {
        return next(new AppError('subcode, Eva_Mon_Year, testcode and a PDF file are required', 400));
    }
    if (!['question_paper', 'answer_key'].includes(uploadType)) {
        return next(new AppError('Invalid upload type specified', 400));
    }

    const normalizedTestcode = String(testcode).trim();
    if (!normalizedTestcode || /\s/.test(normalizedTestcode)) {
        return next(new AppError('Test code cannot be blank or contain spaces', 400));
    }

    const subject = await db.sub_master.findOne({ where: { Subcode: subcode, testcode: normalizedTestcode } });
    if (!subject) {
        return next(new AppError(`Subject ${subcode} with testcode ${normalizedTestcode} was not found in subject master`, 404));
    }
    if (!process.env.AWS_BUCKET_NAME) {
        return next(new AppError('AWS S3 bucket is not configured', 500));
    }

    const objectFolder = uploadType === 'question_paper' ? 'qbs' : 'ans';
    const objectKey = `qbs_and_answerkey/${Eva_Mon_Year}/${normalizedTestcode}/${objectFolder}/${subcode}/${uploadType}.pdf`;
    try {
        await s3.send(new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: objectKey,
            Body: file.buffer || fs.readFileSync(file.path),
            ContentType: 'application/pdf',
        }));
        await subject.update({
            testcode: normalizedTestcode,
            [uploadType === 'question_paper' ? 'qb_flg' : 'ans_flg']: 'Y',
        });

        res.status(200).json({
            success: true,
            message: `${uploadType === 'question_paper' ? 'Question paper' : 'Answer key'} uploaded successfully`,
            data: { subcode, Eva_Mon_Year, testcode: normalizedTestcode, objectKey },
        });
    } finally {
        if (file.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    }
});

module.exports = {
    getAllSubjects,
    getQuestionPaperBySubcode,
    QuestionAnswerUpload
};