const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Cuet_Master = db.cuetMaster;
const Cuet_Question = db.cuetQuestion;
const Cuet_Medium = db.cuetMedium;
const Test_Master = db.Test_Master;
const District_Master = db.District_Master;

const buildDistrictMap = async (districtCodes) => {
  if (!districtCodes || districtCodes.length === 0) {
    return {};
  }

  const districts = await District_Master.findAll({
    where: { DCODE: { [Op.in]: districtCodes } },
    attributes: ['DCODE', 'DNAME'],
    raw: true,
  });

  const districtMap = {};
  districts.forEach((district) => {
    districtMap[district.DCODE] = district.DNAME;
  });

  return districtMap;
};

const calculateMedian = (values) => {
  const sorted = values.filter((v) => v !== null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const calculateAverage = (values) => {
  const filtered = values.filter((v) => v !== null && !isNaN(v));
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, v) => sum + v, 0) / filtered.length;
};

exports.getTestCodesForReport = catchAsync(async (req, res) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '003' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({
    status: 'success',
    data: testMasters,
  });
});

exports.getCuetMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '003' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) {
    return next(new AppError('Test not found', 404));
  }

  const marks = await Cuet_Master.findAll({
    where: { Test_Code: testCode },
    order: [['TOTAL', 'DESC']],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: { testMaster, marks: [], count: 0 },
    });
  }

  const districtCodes = [...new Set(marks.map((m) => m.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedMarks = marks.map((mark) => ({
    ...mark,
    District_Name: districtMap[mark.BATCHNAME] || mark.BATCHNAME,
  }));

  res.status(200).json({
    status: 'success',
    data: {
      testMaster,
      marks: enrichedMarks,
      count: enrichedMarks.length,
    },
  });
});

exports.getCuetQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const qbDetails = await Cuet_Question.findAll({
    where: { Test_Code: testCode },
    order: [
      ['BATCHNAME', 'ASC'],
      ['Qno', 'ASC'],
    ],
    raw: true,
  });

  const districtCodes = [...new Set(qbDetails.map((q) => q.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedQbDetails = qbDetails.map((qb) => ({
    ...qb,
    District_Name: districtMap[qb.BATCHNAME] || qb.BATCHNAME,
  }));

  res.status(200).json({
    status: 'success',
    data: {
      qbDetails: enrichedQbDetails,
      count: enrichedQbDetails.length,
    },
  });
});

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

  const marks = await Cuet_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'TOTAL4', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: {
          accountancy: null,
          economics: null,
          businessStudiesCommerce: null,
          businessMaths: null,
        },
        byDistrict: [],
      },
    });
  }

  const accountancyScores = marks.map((m) => parseFloat(m.TOTAL1));
  const economicsScores = marks.map((m) => parseFloat(m.TOTAL2));
  const businessStudiesCommerceScores = marks.map((m) => parseFloat(m.TOTAL3));
  const businessMathsScores = marks.map((m) => parseFloat(m.TOTAL4));

  const overallStats = {
    accountancy: {
      average: calculateAverage(accountancyScores).toFixed(2),
      median: calculateMedian(accountancyScores).toFixed(2),
      count: marks.length,
    },
    economics: {
      average: calculateAverage(economicsScores).toFixed(2),
      median: calculateMedian(economicsScores).toFixed(2),
      count: marks.length,
    },
    businessStudiesCommerce: {
      average: calculateAverage(businessStudiesCommerceScores).toFixed(2),
      median: calculateMedian(businessStudiesCommerceScores).toFixed(2),
      count: marks.length,
    },
    businessMaths: {
      average: calculateAverage(businessMathsScores).toFixed(2),
      median: calculateMedian(businessMathsScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = {
          accountancy: [],
          economics: [],
          businessStudiesCommerce: [],
          businessMaths: [],
        };
      }

      districtGroups[district].accountancy.push(parseFloat(mark.TOTAL1));
      districtGroups[district].economics.push(parseFloat(mark.TOTAL2));
      districtGroups[district].businessStudiesCommerce.push(parseFloat(mark.TOTAL3));
      districtGroups[district].businessMaths.push(parseFloat(mark.TOTAL4));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        accountancy: {
          average: calculateAverage(scores.accountancy).toFixed(2),
          median: calculateMedian(scores.accountancy).toFixed(2),
          count: scores.accountancy.filter((v) => v !== null && !isNaN(v)).length,
        },
        economics: {
          average: calculateAverage(scores.economics).toFixed(2),
          median: calculateMedian(scores.economics).toFixed(2),
          count: scores.economics.filter((v) => v !== null && !isNaN(v)).length,
        },
        businessStudiesCommerce: {
          average: calculateAverage(scores.businessStudiesCommerce).toFixed(2),
          median: calculateMedian(scores.businessStudiesCommerce).toFixed(2),
          count: scores.businessStudiesCommerce.filter((v) => v !== null && !isNaN(v)).length,
        },
        businessMaths: {
          average: calculateAverage(scores.businessMaths).toFixed(2),
          median: calculateMedian(scores.businessMaths).toFixed(2),
          count: scores.businessMaths.filter((v) => v !== null && !isNaN(v)).length,
        },
      }))
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  }

  res.status(200).json({
    status: 'success',
    data: {
      overall: overallStats,
      byDistrict: districtStats,
    },
  });
});

exports.getQuestionStatisticsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const questionStats = await Cuet_Medium.findAll({
    where: { Test_Code: testCode },
    order: [
      ['D_CODE', 'ASC'],
      ['Medium', 'ASC'],
      ['Qno', 'ASC'],
    ],
    raw: true,
  });

  const districtCodes = [...new Set(questionStats.map((q) => q.D_CODE).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedStats = questionStats.map((stat) => ({
    ...stat,
    District_Name: districtMap[stat.D_CODE] || stat.D_CODE,
    Medium_Label: stat.Medium === 'E' ? 'English' : stat.Medium === 'T' ? 'Tamil' : '',
  }));

  res.status(200).json({
    status: 'success',
    data: {
      questionStatistics: enrichedStats,
      count: enrichedStats.length,
    },
  });
});

module.exports = exports;
