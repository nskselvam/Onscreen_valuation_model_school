const db = require('../db/models');
const { Test_Master, Jee_Marks, Jee_Qb_Details, Question_Statistics } = db;
const Neet_Master = db.neetmaster;
const Neet_Question = db.neetQuestion;
const Neet_Medium = db.neetMedium;
const Cuet_Master = db.cuetMaster;
const Cuet_Question = db.cuetQuestion;
const Cuet_Medium = db.cuetMedium;
const CurrentAffairs_Master = db.currentAffairsMaster;
const CurrentAffairs_Question = db.currentAffairsQuestion;
const GeneralAbility_Master = db.generalAbilityData;
const GeneralAbility_Question = db.generalAbilityQuestion;
const Foundation_Master = db.foundationMaster;
const Foundation_Question = db.foundationQuestion;
const Quantitative_Master = db.quantitativeMaster;
const Quantitative_Question = db.quantitativeQuestion;
const SpokenEnglish_Master = db.spokenEnglisMaster;
const SpokenEnglish_Question = db.spoken_english_qb_details;
const Humanities_Master = db.humanitiesData;
const Humanities_Question = db.humanitiesQuestion;
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

// Get all test masters with pagination and search
exports.getAllTestMasters = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 200, search = '' } = req.query;
  const offset = (page - 1) * limit;

  const whereClause = search
    ? {
        [Op.or]: [
          { testcode: { [Op.iLike]: `%${search}%` } },
          { Test_Name: { [Op.iLike]: `%${search}%` } },
          { testdate: { [Op.iLike]: `%${search}%` } }
        ]
      }
    : {};

  const { count, rows } = await Test_Master.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: rows,
    total: count,
    page: parseInt(page),
    totalPages: Math.ceil(count / limit)
  });
});

// Get test master by ID
exports.getTestMasterById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testMaster = await Test_Master.findByPk(id);

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: testMaster
  });
});

// Get test masters ready for image upload (checkflg=Y, Img_Upload=N, percentile_gen=N)
exports.getTestMastersForImageUpload = catchAsync(async (req, res, next) => {
  const { districtCode } = req.query;

  // Base query conditions
  const whereConditions = {
    checkflg: 'Y',
    percentile_gen: 'N'
  };

  // Fetch all test masters that meet base criteria
  const testMasters = await Test_Master.findAll({
    where: whereConditions,
    order: [['testcode', 'ASC']],
    attributes: ['id', 'testcode', 'Test_Name', 'testdate', 'test_districts', 'image_upload_districts', 'Img_Upload']
  });

  // Filter tests based on district-specific upload status
  let filteredTestMasters = testMasters;
  
  if (districtCode) {
    const normalizedDistCode = districtCode.substring(0, 2).trim();
    
    filteredTestMasters = testMasters.filter(test => {
      // Check if district is assigned to this test
      const testDistricts = test.test_districts ? test.test_districts.split(',') : [];
      const districtPosition = testDistricts.findIndex(d => d.trim().substring(0, 2) === normalizedDistCode);
      
      if (districtPosition === -1) return false; // District not assigned to test
      
      // Check image upload status for this district
      const imageUploadDistricts = test.image_upload_districts ? test.image_upload_districts.split(',') : [];
      const districtStatus = imageUploadDistricts[districtPosition] || 'N';
      
      // Only include if district status is 'N' and overall Img_Upload is 'N'
      return districtStatus.trim().toUpperCase() === 'N' && test.Img_Upload === 'N';
    });
  } else {
    // If no district code provided, use old logic (only Img_Upload = N)
    filteredTestMasters = testMasters.filter(test => test.Img_Upload === 'N');
  }

  res.status(200).json({
    status: 'success',
    data: filteredTestMasters
  });
});

// Create new test master
exports.createTestMaster = catchAsync(async (req, res, next) => {
  const {
    testcode,
    testdate,
    sessions,
    no_of_ques,
    type_of_exam,
    std,
    exam_desc,
    flg,
    checkflg,
    Img_Upload,
    Key_Upload,
    percentile_gen,
    Test_Name,
    test_districts,
    repeaters,
    image_upload_districts
  } = req.body;

  // Validate mandatory fields
  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }
  if (!testdate) {
    return next(new AppError('Test date is required', 400));
  }
  if (!Test_Name) {
    return next(new AppError('Test name is required', 400));
  }
  if (!sessions) {
    return next(new AppError('Session is required', 400));
  }
  if (!no_of_ques) {
    return next(new AppError('No. of Questions is required', 400));
  }
  if (!type_of_exam) {
    return next(new AppError('Type of Exam is required', 400));
  }
  if (!std) {
    return next(new AppError('Standard is required', 400));
  }
  if (!exam_desc || exam_desc.trim() === '') {
    return next(new AppError('Exam Description is required', 400));
  }
  if (!test_districts || test_districts.trim() === '') {
    return next(new AppError('Test districts are required', 400));
  }

  // Check if testcode already exists
  const existingTest = await Test_Master.findOne({
    where: { testcode }
  });

  if (existingTest) {
    return next(new AppError('Test code already exists', 400));
  }

  const newTestMaster = await Test_Master.create({
    testcode,
    testdate,
    sessions,
    no_of_ques,
    type_of_exam,
    std,
    exam_desc,
    flg,
    checkflg: checkflg || 'N',
    Img_Upload: Img_Upload || 'N',
    Key_Upload: Key_Upload || 'N',
    percentile_gen: percentile_gen || 'N',
    Test_Name,
    test_districts,
    repeaters: repeaters || 'N',
    image_upload_districts: image_upload_districts || null
  });

  res.status(201).json({
    status: 'success',
    message: 'Test master created successfully',
    data: newTestMaster
  });
});

// Update test master
exports.updateTestMaster = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    testcode,
    testdate,
    sessions,
    no_of_ques,
    type_of_exam,
    std,
    exam_desc,
    flg,
    checkflg,
    Img_Upload,
    Key_Upload,
    percentile_gen,
    Test_Name,
    test_districts,
    repeaters,
    image_upload_districts
  } = req.body;

  // Validate mandatory fields
  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }
  if (!testdate) {
    return next(new AppError('Test date is required', 400));
  }
  if (!Test_Name) {
    return next(new AppError('Test name is required', 400));
  }
  if (!sessions) {
    return next(new AppError('Session is required', 400));
  }
  if (!no_of_ques) {
    return next(new AppError('No. of Questions is required', 400));
  }
  if (!type_of_exam) {
    return next(new AppError('Type of Exam is required', 400));
  }
  if (!std) {
    return next(new AppError('Standard is required', 400));
  }
  if (!exam_desc || exam_desc.trim() === '') {
    return next(new AppError('Exam Description is required', 400));
  }
  if (!test_districts || test_districts.trim() === '') {
    return next(new AppError('Test districts are required', 400));
  }

  const testMaster = await Test_Master.findByPk(id);

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  // Check if testcode is being changed and if new code already exists
  if (testcode !== testMaster.testcode) {
    const existingTest = await Test_Master.findOne({
      where: { 
        testcode,
        id: { [Op.ne]: id }
      }
    });

    if (existingTest) {
      return next(new AppError('Test code already exists', 400));
    }
  }

  await testMaster.update({
    testcode,
    testdate,
    sessions,
    no_of_ques,
    type_of_exam,
    std,
    exam_desc,
    flg,
    checkflg,
    Img_Upload,
    Key_Upload,
    percentile_gen,
    Test_Name,
    test_districts,
    repeaters: repeaters || 'N',
    image_upload_districts: image_upload_districts || null
  });

  res.status(200).json({
    status: 'success',
    message: 'Test master updated successfully',
    data: testMaster
  });
});

// Delete test master
exports.deleteTestMaster = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const testMaster = await Test_Master.findByPk(id);

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  await testMaster.destroy();

  res.status(200).json({
    status: 'success',
    message: 'Test master deleted successfully'
  });
});

// Delete test marks and QB details by test code
exports.deleteTestMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testcode } = req.params;
  const { deleteResult, deleteQB, deleteQBMedium } = req.body;

  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  // Check if at least one option is selected
  if (!deleteResult && !deleteQB && !deleteQBMedium) {
    return next(new AppError('Please select at least one option to delete', 400));
  }

  // Check if test master exists
  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found with this test code', 404));
  }

  // Resolve models based on exam type — normalize to string and strip whitespace
  const examType = String(testMaster.type_of_exam || '').trim().padStart(3, '0');
  let MarksModel, QbModel, MediumModel;

  console.log(`[deleteTestMarksByTestCode] testcode=${testcode}, raw type_of_exam=${testMaster.type_of_exam}, normalized=${examType}`);


  
  if (examType === '002') {
    MarksModel = Neet_Master;
    QbModel = Neet_Question;
    MediumModel = Neet_Medium;
  } else if (examType === '003') {
    MarksModel = Cuet_Master;
    QbModel = Cuet_Question;
    MediumModel = Cuet_Medium;
  }
  else if (examType === '006') {
    MarksModel = CurrentAffairs_Master;
    QbModel = CurrentAffairs_Question;
    MediumModel = null; // Assuming no medium model for current affairs
  } else if (examType === '009') {
    MarksModel = GeneralAbility_Master;
    QbModel = GeneralAbility_Question;
    MediumModel = null; // Assuming no medium model for general ability
  }
  else if (examType === '005') {
    MarksModel = Quantitative_Master;
    QbModel = Quantitative_Question;
    MediumModel = null;
  } else if (examType === '008') {
    MarksModel = Foundation_Master;
    QbModel = Foundation_Question;
    MediumModel = null;
  } else if (examType === '010') {
    MarksModel = SpokenEnglish_Master;
    QbModel = SpokenEnglish_Question;
    MediumModel = null;
  } else if (examType === '011') {
    MarksModel = Humanities_Master;
    QbModel = Humanities_Question;
    MediumModel = null;
  }
  else {
    // Default: JEE (001)
    MarksModel = Jee_Marks;
    QbModel = Jee_Qb_Details;
    MediumModel = Question_Statistics;
  }

  let marksDeleted = 0;
  let qbDeleted = 0;
  let qbMediumDeleted = 0;
  const deletedItems = [];

  // Delete marks if selected
  if (deleteResult) {
    const markCount = await MarksModel.count({ where: { Test_Code: testcode } });
    console.log(`[deleteTestMarksByTestCode] marks count for Test_Code='${testcode}': ${markCount}`);
    marksDeleted = await MarksModel.destroy({
      where: { Test_Code: testcode }
    });
    if (marksDeleted > 0) deletedItems.push(`${marksDeleted} marks`);
  }

  // Delete QB details if selected
  if (deleteQB) {
    const qbCount = await QbModel.count({ where: { Test_Code: testcode } });
    console.log(`[deleteTestMarksByTestCode] QB count for Test_Code='${testcode}': ${qbCount}`);
    qbDeleted = await QbModel.destroy({
      where: { Test_Code: testcode }
    });
    if (qbDeleted > 0) deletedItems.push(`${qbDeleted} QB records`);
  }

  // Delete QB medium records if selected
  if (deleteQBMedium && MediumModel) {
    const mediumCount = await MediumModel.count({ where: { Test_Code: testcode } });
    console.log(`[deleteTestMarksByTestCode] QB medium count for Test_Code='${testcode}': ${mediumCount}`);
    qbMediumDeleted = await MediumModel.destroy({
      where: { Test_Code: testcode }
    });
    if (qbMediumDeleted > 0) deletedItems.push(`${qbMediumDeleted} QB medium records`);
  }

  const totalDeleted = marksDeleted + qbDeleted + qbMediumDeleted;
  const message = deletedItems.length > 0 
    ? `Successfully deleted: ${deletedItems.join(', ')}` 
    : 'No records found to delete';

  res.status(200).json({
    status: 'success',
    message,
    data: {
      testcode,
      marksDeleted,
      qbDeleted,
      qbMediumDeleted,
      totalDeleted
    }
  });
});

// Toggle district image upload status
exports.toggleDistrictImageStatus = catchAsync(async (req, res, next) => {
  const { testcode, districtCode } = req.body;

  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  if (!districtCode) {
    return next(new AppError('District code is required', 400));
  }

  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found', 404));
  }

  const normalizedDistCode = districtCode.substring(0, 2).trim();
  const testDistricts = testMaster.test_districts ? testMaster.test_districts.split(',') : [];
  const imageUploadDistricts = testMaster.image_upload_districts ? testMaster.image_upload_districts.split(',') : [];

  // Find the position of the district code in test_districts
  const districtPosition = testDistricts.findIndex(d => d.trim().substring(0, 2) === normalizedDistCode);

  if (districtPosition === -1) {
    return res.status(400).json({
      status: 'error',
      message: `District code '${districtCode}' not found in test districts`
    });
  }

  // Toggle the status at that position
  const currentStatus = imageUploadDistricts[districtPosition] || 'N';
  imageUploadDistricts[districtPosition] = currentStatus === 'Y' ? 'N' : 'Y';

  // Update test master with new image_upload_districts
  await testMaster.update({
    image_upload_districts: imageUploadDistricts.join(',')
  });

  res.status(200).json({
    status: 'success',
    message: `District ${districtCode} image upload status toggled to '${imageUploadDistricts[districtPosition]}'`,
    data: {
      testcode,
      districtCode,
      newStatus: imageUploadDistricts[districtPosition],
      image_upload_districts: imageUploadDistricts.join(',')
    }
  });
});

// Delete district-wise test data
exports.deleteDistrictTestData = catchAsync(async (req, res, next) => {
  const { testcode } = req.params;
  const { districtCodes, deleteResult, deleteQB, deleteQBMedium } = req.body;

  if (!testcode) {
    return next(new AppError('Test code is required', 400));
  }

  if (!districtCodes || !Array.isArray(districtCodes) || districtCodes.length === 0) {
    return next(new AppError('At least one district code is required', 400));
  }

  if (!deleteResult && !deleteQB && !deleteQBMedium) {
    return next(new AppError('Please select at least one option to delete', 400));
  }

  // Check if test master exists
  const testMaster = await Test_Master.findOne({
    where: { testcode }
  });

  if (!testMaster) {
    return next(new AppError('Test master not found with this test code', 404));
  }

  let marksDeleted = 0;
  let qbDeleted = 0;
  let qbMediumDeleted = 0;
  const deletionResults = [];

  // Process each district
  for (const districtCode of districtCodes) {
    const normalizedDistCode = districtCode.substring(0, 2).trim();
    let districtMarks = 0;
    let districtQB = 0;
    let districtQBMedium = 0;

    // Delete marks from Jee_Marks table if selected
    if (deleteResult) {
      districtMarks = await Jee_Marks.destroy({
        where: { 
          Test_Code: testcode,
          BATCHNAME: { [Op.iLike]: `${normalizedDistCode}%` }
        }
      });
      marksDeleted += districtMarks;
    }

    // Delete QB details from Jee_Qb_Details table if selected
    if (deleteQB) {
      districtQB = await Jee_Qb_Details.destroy({
        where: { 
          Test_Code: testcode,
          BATCHNAME: { [Op.iLike]: `${normalizedDistCode}%` }
        }
      });
      qbDeleted += districtQB;
    }

    // Delete question statistics from Question_Statistics table if selected
    if (deleteQBMedium) {
      districtQBMedium = await Question_Statistics.destroy({
        where: { 
          Test_Code: testcode,
          D_CODE: { [Op.iLike]: `${normalizedDistCode}%` }
        }
      });
      qbMediumDeleted += districtQBMedium;
    }

    if (districtMarks > 0 || districtQB > 0 || districtQBMedium > 0) {
      deletionResults.push({
        districtCode,
        marksDeleted: districtMarks,
        qbDeleted: districtQB,
        qbMediumDeleted: districtQBMedium,
        total: districtMarks + districtQB + districtQBMedium
      });
    }
  }

  const totalDeleted = marksDeleted + qbDeleted + qbMediumDeleted;
  const deletedItems = [];
  if (marksDeleted > 0) deletedItems.push(`${marksDeleted} marks`);
  if (qbDeleted > 0) deletedItems.push(`${qbDeleted} QB records`);
  if (qbMediumDeleted > 0) deletedItems.push(`${qbMediumDeleted} QB medium records`);

  const message = deletedItems.length > 0 
    ? `Successfully deleted from ${districtCodes.length} district(s): ${deletedItems.join(', ')}` 
    : 'No records found to delete';

  res.status(200).json({
    status: 'success',
    message,
    data: {
      testcode,
      districtsProcessed: districtCodes.length,
      marksDeleted,
      qbDeleted,
      qbMediumDeleted,
      totalDeleted,
      deletionResults
    }
  });
});
