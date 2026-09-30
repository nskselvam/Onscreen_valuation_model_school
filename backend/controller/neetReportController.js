const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Neet_Master = db.neetmaster;
const Neet_Question = db.neetQuestion;
const Neet_Medium = db.neetMedium;
const Test_Master = db.Test_Master;
const District_Master = db.District_Master;

const buildDistrictMap = async (districtCodes) => {
  if (!districtCodes || districtCodes.length === 0) {
    return {};
  }

  const districts = await District_Master.findAll({
    where: { DCODE: { [Op.in]: districtCodes } },
    attributes: ['DCODE', 'DNAME'],
    raw: true
  });

  const districtMap = {};
  districts.forEach((district) => {
    districtMap[district.DCODE] = district.DNAME;
  });

  return districtMap;
};

const calculateMedian = (values) => {
  const sorted = values.filter(v => v !== null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
};

const calculateAverage = (values) => {
  const filtered = values.filter(v => v !== null && !isNaN(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
};

// Get NEET test codes with test details for report
exports.getTestCodesForReport = catchAsync(async (req, res, next) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '002' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']]
  });

  res.status(200).json({
    status: 'success',
    data: testMasters
  });
});

// Get NEET marks data for a specific test code
exports.getNeetMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const testMaster = await Test_Master.findOne({
    where: {
      testcode: testCode,
      type_of_exam: '002'
    },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam']
  });

  if (!testMaster) {
    return next(new AppError('Test not found', 404));
  }

  const marks = await Neet_Master.findAll({
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

  const districtCodes = [...new Set(marks.map(m => m.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

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

// Get NEET QB details for a specific test code
exports.getNeetQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const qbDetails = await Neet_Question.findAll({
    where: { Test_Code: testCode },
    order: [
      ['BATCHNAME', 'ASC'],
      ['Qno', 'ASC']
    ],
    raw: true
  });

  const districtCodes = [...new Set(qbDetails.map(q => q.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

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

// Get subject-wise average and median for NEET by test code
exports.getSubjectWiseStatsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  const { districtCode } = req.query;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const whereClause = { Test_Code: testCode };
  if (districtCode) {
    whereClause.BATCHNAME = districtCode;
  }

  const marks = await Neet_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'TOTAL4', 'BATCHNAME'],
    raw: true
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { physics: null, chemistry: null, botany: null, zoology: null },
        byDistrict: []
      }
    });
  }

  const physicsScores = marks.map(m => parseFloat(m.TOTAL1));
  const chemistryScores = marks.map(m => parseFloat(m.TOTAL2));
  const botanyScores = marks.map(m => parseFloat(m.TOTAL3));
  const zoologyScores = marks.map(m => parseFloat(m.TOTAL4));

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
    botany: {
      average: calculateAverage(botanyScores).toFixed(2),
      median: calculateMedian(botanyScores).toFixed(2),
      count: marks.length
    },
    zoology: {
      average: calculateAverage(zoologyScores).toFixed(2),
      median: calculateMedian(zoologyScores).toFixed(2),
      count: marks.length
    }
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = {
          physics: [],
          chemistry: [],
          botany: [],
          zoology: []
        };
      }

      districtGroups[district].physics.push(parseFloat(mark.TOTAL1));
      districtGroups[district].chemistry.push(parseFloat(mark.TOTAL2));
      districtGroups[district].botany.push(parseFloat(mark.TOTAL3));
      districtGroups[district].zoology.push(parseFloat(mark.TOTAL4));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

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
      botany: {
        average: calculateAverage(scores.botany).toFixed(2),
        median: calculateMedian(scores.botany).toFixed(2),
        count: scores.botany.filter(v => v !== null && !isNaN(v)).length
      },
      zoology: {
        average: calculateAverage(scores.zoology).toFixed(2),
        median: calculateMedian(scores.zoology).toFixed(2),
        count: scores.zoology.filter(v => v !== null && !isNaN(v)).length
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

// Get NEET medium-wise question statistics for a specific test code
exports.getQuestionStatisticsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const questionStats = await Neet_Medium.findAll({
    where: { Test_Code: testCode },
    order: [
      ['D_CODE', 'ASC'],
      ['Medium', 'ASC'],
      ['Qno', 'ASC']
    ],
    raw: true
  });

  const districtCodes = [...new Set(questionStats.map(q => q.D_CODE).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

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
