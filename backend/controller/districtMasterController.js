const { District_Master } = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

// Get all districts with pagination and search
exports.getAllDistricts = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 1000, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = search
    ? {
        [Op.or]: [
          { DCODE: { [Op.iLike]: `%${search}%` } },
          { DNAME: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  const { count, rows } = await District_Master.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['DCODE', 'ASC']]
  });

  res.status(200).json({
    status: 'success',
    data: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  });
});

// Get district by ID
exports.getDistrictById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const district = await District_Master.findByPk(id);

  if (!district) {
    return next(new AppError('District not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: district
  });
});

// Create new district
exports.createDistrict = catchAsync(async (req, res, next) => {
  const { DCODE, DNAME } = req.body;

  // Validate mandatory fields
  if (!DCODE || DCODE.trim() === '') {
    return next(new AppError('District code is required', 400));
  }
  if (!DNAME || DNAME.trim() === '') {
    return next(new AppError('District name is required', 400));
  }

  // Check if district code already exists
  const existingDistrict = await District_Master.findOne({
    where: { DCODE }
  });

  if (existingDistrict) {
    return next(new AppError('District code already exists', 400));
  }

  const newDistrict = await District_Master.create({
    DCODE,
    DNAME
  });

  res.status(201).json({
    status: 'success',
    message: 'District created successfully',
    data: newDistrict
  });
});

// Update district
exports.updateDistrict = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { DCODE, DNAME } = req.body;

  // Validate mandatory fields
  if (!DCODE || DCODE.trim() === '') {
    return next(new AppError('District code is required', 400));
  }
  if (!DNAME || DNAME.trim() === '') {
    return next(new AppError('District name is required', 400));
  }

  const district = await District_Master.findByPk(id);

  if (!district) {
    return next(new AppError('District not found', 404));
  }

  // Check if district code is being changed and if new code already exists
  if (DCODE !== district.DCODE) {
    const existingDistrict = await District_Master.findOne({
      where: { 
        DCODE,
        id: { [Op.ne]: id }
      }
    });

    if (existingDistrict) {
      return next(new AppError('District code already exists', 400));
    }
  }

  await district.update({
    DCODE,
    DNAME
  });

  res.status(200).json({
    status: 'success',
    message: 'District updated successfully',
    data: district
  });
});

// Delete district
exports.deleteDistrict = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const district = await District_Master.findByPk(id);

  if (!district) {
    return next(new AppError('District not found', 404));
  }

  await district.destroy();

  res.status(200).json({
    status: 'success',
    message: 'District deleted successfully'
  });
});
