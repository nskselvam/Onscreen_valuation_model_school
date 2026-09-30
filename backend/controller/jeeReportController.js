const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const Jee_Marks = db.Jee_Marks;
const Test_Master = db.Test_Master;
const District_Master = db.District_Master;
const Jee_Qb_Details = db.Jee_Qb_Details;
const Question_Statistics = db.Question_Statistics;

// Get all test codes with test details for report
exports.getTestCodesForReport = catchAsync(async (req, res, next) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '001' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: testMasters
  });
});

// Get JEE marks data for a specific test code
exports.getJeeMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get test master details
  const testMaster = await Test_Master.findOne({
    where: {
      testcode: testCode,
      type_of_exam: '001'
    },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions']
  });

  if (!testMaster) {
    return next(new AppError('Test not found', 404));
  }

  // Get all marks for this test code with district names
  const marks = await Jee_Marks.findAll({
    where: { Test_Code: testCode },
    order: [['TOTAL', 'DESC']],
    raw: true
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        testMaster,
        marks: [],
        count: 0
      }
    });
  }

  // Get district names for the marks
  const districtCodes = [...new Set(marks.map(m => m.BATCHNAME).filter(Boolean))];
  const districts = await District_Master.findAll({
    where: {
      DCODE: { [Op.in]: districtCodes }
    },
    attributes: ['DCODE', 'DNAME'],
    raw: true
  });

  // Create district code to name mapping
  const districtMap = {};
  districts.forEach(d => {
    districtMap[d.DCODE] = d.DNAME;
  });

  // Add district names to marks
  const enrichedMarks = marks.map(mark => ({
    ...mark,
    District_Name: districtMap[mark.BATCHNAME] || mark.BATCHNAME
  }));

  res.status(200).json({
    status: 'success',
    data: {
      testMaster,
      marks: enrichedMarks,
      count: enrichedMarks.length
    }
  });
});

// Get JEE QB details for a specific test code
exports.getJeeQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get QB details for this test code
  const qbDetails = await Jee_Qb_Details.findAll({
    where: { Test_Code: testCode },
    order: [
      ['BATCHNAME', 'ASC'],
      ['Qno', 'ASC']
    ],
    raw: true
  });

  // Get district names for the QB details
  const districtCodes = [...new Set(qbDetails.map(q => q.BATCHNAME).filter(Boolean))];
  const districts = await District_Master.findAll({
    where: {
      DCODE: { [Op.in]: districtCodes }
    },
    attributes: ['DCODE', 'DNAME'],
    raw: true
  });

  // Create district code to name mapping
  const districtMap = {};
  districts.forEach(d => {
    districtMap[d.DCODE] = d.DNAME;
  });

  // Add district names to QB details
  const enrichedQbDetails = qbDetails.map(qb => ({
    ...qb,
    District_Name: districtMap[qb.BATCHNAME] || qb.BATCHNAME
  }));

  res.status(200).json({
    status: 'success',
    data: {
      qbDetails: enrichedQbDetails,
      count: enrichedQbDetails.length
    }
  });
});

// Get subject-wise average and median by test code
exports.getSubjectWiseStatsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  const { districtCode } = req.query;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Build where clause
  const whereClause = { Test_Code: testCode };
  if (districtCode) {
    whereClause.BATCHNAME = districtCode;
  }

  // Get all marks for this test code
  const marks = await Jee_Marks.findAll({
    where: whereClause,
    attributes: ['Phy_Tot', 'che_Tot', 'Mat_Tot', 'BATCHNAME'],
    raw: true
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { physics: null, chemistry: null, maths: null },
        byDistrict: []
      }
    });
  }

  // Helper function to calculate median
  const calculateMedian = (values) => {
    const sorted = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  };

  // Helper function to calculate average
  const calculateAverage = (values) => {
    const filtered = values.filter(v => v !== null && !isNaN(v));
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
  };

  // Calculate overall statistics
  const physicsScores = marks.map(m => parseFloat(m.Phy_Tot));
  const chemistryScores = marks.map(m => parseFloat(m.che_Tot));
  const mathsScores = marks.map(m => parseFloat(m.Mat_Tot));

  const overallStats = {
    physics: {
      average: calculateAverage(physicsScores).toFixed(2),
      median: calculateMedian(physicsScores).toFixed(2),
      count: marks.length
    },
    chemistry: {
      average: calculateAverage(chemistryScores).toFixed(2),
      median: calculateMedian(chemistryScores).toFixed(2),
      count: marks.length
    },
    maths: {
      average: calculateAverage(mathsScores).toFixed(2),
      median: calculateMedian(mathsScores).toFixed(2),
      count: marks.length
    }
  };

  // Calculate district-wise statistics if no specific district filter
  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach(mark => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = {
          physics: [],
          chemistry: [],
          maths: []
        };
      }
      districtGroups[district].physics.push(parseFloat(mark.Phy_Tot));
      districtGroups[district].chemistry.push(parseFloat(mark.che_Tot));
      districtGroups[district].maths.push(parseFloat(mark.Mat_Tot));
    });

    // Get district names
    const districtCodes = Object.keys(districtGroups);
    const districts = await District_Master.findAll({
      where: { DCODE: { [Op.in]: districtCodes } },
      attributes: ['DCODE', 'DNAME'],
      raw: true
    });

    const districtMap = {};
    districts.forEach(d => {
      districtMap[d.DCODE] = d.DNAME;
    });

    districtStats = Object.entries(districtGroups).map(([code, scores]) => ({
      districtCode: code,
      districtName: districtMap[code] || code,
      physics: {
        average: calculateAverage(scores.physics).toFixed(2),
        median: calculateMedian(scores.physics).toFixed(2),
        count: scores.physics.filter(v => v !== null && !isNaN(v)).length
      },
      chemistry: {
        average: calculateAverage(scores.chemistry).toFixed(2),
        median: calculateMedian(scores.chemistry).toFixed(2),
        count: scores.chemistry.filter(v => v !== null && !isNaN(v)).length
      },
      maths: {
        average: calculateAverage(scores.maths).toFixed(2),
        median: calculateMedian(scores.maths).toFixed(2),
        count: scores.maths.filter(v => v !== null && !isNaN(v)).length
      }
    })).sort((a, b) => a.districtName.localeCompare(b.districtName));
  }

  res.status(200).json({
    status: 'success',
    data: {
      overall: overallStats,
      byDistrict: districtStats
    }
  });
});

// Get question statistics for a specific test code
exports.getQuestionStatisticsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get question statistics for this test code
  const questionStats = await Question_Statistics.findAll({
    where: { Test_Code: testCode },
    order: [
      ['D_CODE', 'ASC'],
      ['Medium', 'ASC'],
      ['Qno', 'ASC']
    ],
    raw: true
  });

  // Get district names for the statistics
  const districtCodes = [...new Set(questionStats.map(q => q.D_CODE).filter(Boolean))];
  const districts = await District_Master.findAll({
    where: {
      DCODE: { [Op.in]: districtCodes }
    },
    attributes: ['DCODE', 'DNAME'],
    raw: true
  });

  // Create district code to name mapping
  const districtMap = {};
  districts.forEach(d => {
    districtMap[d.DCODE] = d.DNAME;
  });

  // Add district names to question statistics
  const enrichedStats = questionStats.map(stat => ({
    ...stat,
    District_Name: districtMap[stat.D_CODE] || stat.D_CODE,
    Medium_Label: stat.Medium === 'E' ? 'English' : stat.Medium === 'T' ? 'Tamil' : ''
  }));

  res.status(200).json({
    status: 'success',
    data: {
      questionStatistics: enrichedStats,
      count: enrichedStats.length
    }
  });
});

module.exports = exports;
