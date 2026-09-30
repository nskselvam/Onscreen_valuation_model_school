const { Type_Exam } = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

// Get all type exams with pagination and search
exports.getAllTypeExams = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 100, search = '' } = req.query;
  const offset = (page - 1) * limit;

  // console.log(`Fetching type exams with page: ${page}, limit: ${limit}, search: '${search}' offset: ${offset}`);
  // return


  const whereClause = search
    ? {
        [Op.or]: [
          { type_of_exam_code: { [Op.iLike]: `%${search}%` } },
          { type_of_exam_desc: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  const { count, rows } = await Type_Exam.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['type_of_exam_code', 'ASC']]
  });

  console.log(`Fetched ${rows.length} type exams out of ${count} total.`);
  res.status(200).json({
    status: 'success',
    data: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  });
});

// Get type exam by ID
exports.getTypeExamById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const typeExam = await Type_Exam.findByPk(id);

  if (!typeExam) {
    return next(new AppError('Type of exam not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: typeExam
  });
});

// Get next serial number for type_of_exam_code
exports.getNextSerialNumber = catchAsync(async (req, res, next) => {
  const lastRecord = await Type_Exam.findOne({
    order: [['type_of_exam_code', 'DESC']]
  });

  let nextSerial = '001';
  if (lastRecord && lastRecord.type_of_exam_code) {
    const lastNumber = parseInt(lastRecord.type_of_exam_code);
    if (!isNaN(lastNumber)) {
      nextSerial = String(lastNumber + 1).padStart(3, '0');
    }
  }

  res.status(200).json({
    status: 'success',
    data: { nextSerial }
  });
});

// Create new type exam
exports.createTypeExam = catchAsync(async (req, res, next) => {
  const { type_of_exam_code, type_of_exam_desc } = req.body;

  // Check if code already exists
  const existingType = await Type_Exam.findOne({
    where: { type_of_exam_code }
  });

  if (existingType) {
    return next(new AppError('Type of exam code already exists', 400));
  }

  const newTypeExam = await Type_Exam.create({
    type_of_exam_code,
    type_of_exam_desc
  });

  res.status(201).json({
    status: 'success',
    message: 'Type of exam created successfully',
    data: newTypeExam
  });
});

// Update type exam
exports.updateTypeExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { type_of_exam_code, type_of_exam_desc } = req.body;

  const typeExam = await Type_Exam.findByPk(id);

  if (!typeExam) {
    return next(new AppError('Type of exam not found', 404));
  }

  // Check if code is being changed and if new code already exists
  if (type_of_exam_code !== typeExam.type_of_exam_code) {
    const existingType = await Type_Exam.findOne({
      where: { 
        type_of_exam_code,
        id: { [Op.ne]: id }
      }
    });

    if (existingType) {
      return next(new AppError('Type of exam code already exists', 400));
    }
  }

  await typeExam.update({
    type_of_exam_code,
    type_of_exam_desc
  });

  res.status(200).json({
    status: 'success',
    message: 'Type of exam updated successfully',
    data: typeExam
  });
});

// Delete type exam
exports.deleteTypeExam = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const typeExam = await Type_Exam.findByPk(id);

  if (!typeExam) {
    return next(new AppError('Type of exam not found', 404));
  }

  await typeExam.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Type of exam deleted successfully'
  });
});
