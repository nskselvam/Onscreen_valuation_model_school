const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const CurrentAffairs_Master = db.currentAffairsMaster;
const CurrentAffairs_Question = db.currentAffairsQuestion;
const Test_Master = db.Test_Master;
const District_Master = db.District_Master;

const buildDistrictMap = async (districtCodes) => {
  if (!districtCodes || districtCodes.length === 0) return {};
  const districts = await District_Master.findAll({
    where: { DCODE: { [Op.in]: districtCodes } },
    attributes: ['DCODE', 'DNAME'],
    raw: true,
  });
  const map = {};
  districts.forEach((d) => { map[d.DCODE] = d.DNAME; });
  return map;
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

// GET /test-codes
exports.getTestCodesForReport = catchAsync(async (req, res) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '006' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });
  res.status(200).json({ status: 'success', data: testMasters });
});

// GET /marks/:testCode
exports.getCurrentAffairsMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '006' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });
  if (!testMaster) return next(new AppError('Test not found', 404));

  const marks = await CurrentAffairs_Master.findAll({
    where: { Test_Code: testCode },
    order: [['TOTAL', 'DESC']],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({ status: 'success', data: { testMaster, marks: [], count: 0 } });
  }

  const districtCodes = [...new Set(marks.map((m) => m.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedMarks = marks.map((mark) => ({
    ...mark,
    District_Name: districtMap[mark.BATCHNAME] || mark.BATCHNAME,
  }));

  res.status(200).json({
    status: 'success',
    data: { testMaster, marks: enrichedMarks, count: enrichedMarks.length },
  });
});

// GET /qb-details/:testCode
exports.getCurrentAffairsQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const qbDetails = await CurrentAffairs_Question.findAll({
    where: { Test_Code: testCode },
    order: [['BATCHNAME', 'ASC'], ['Qno', 'ASC']],
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
    data: { qbDetails: enrichedQbDetails, count: enrichedQbDetails.length },
  });
});

// GET /subject-stats/:testCode
exports.getSubjectWiseStatsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  const { districtCode } = req.query;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const whereClause = { Test_Code: testCode };
  if (districtCode) whereClause.BATCHNAME = districtCode;

  const marks = await CurrentAffairs_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { part1: null, part2: null },
        byDistrict: [],
      },
    });
  }

  const part1Scores = marks.map((m) => parseFloat(m.TOTAL1));
  const part2Scores = marks.map((m) => parseFloat(m.TOTAL2));

  const overallStats = {
    part1: {
      average: calculateAverage(part1Scores).toFixed(2),
      median: calculateMedian(part1Scores).toFixed(2),
      count: marks.length,
    },
    part2: {
      average: calculateAverage(part2Scores).toFixed(2),
      median: calculateMedian(part2Scores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const d = mark.BATCHNAME;
      if (!districtGroups[d]) districtGroups[d] = { part1: [], part2: [] };
      districtGroups[d].part1.push(parseFloat(mark.TOTAL1));
      districtGroups[d].part2.push(parseFloat(mark.TOTAL2));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        part1: {
          average: calculateAverage(scores.part1).toFixed(2),
          median: calculateMedian(scores.part1).toFixed(2),
          count: scores.part1.filter((v) => v !== null && !isNaN(v)).length,
        },
        part2: {
          average: calculateAverage(scores.part2).toFixed(2),
          median: calculateMedian(scores.part2).toFixed(2),
          count: scores.part2.filter((v) => v !== null && !isNaN(v)).length,
        },
      }))
      .sort((a, b) => a.districtName.localeCompare(b.districtName));
  }

  res.status(200).json({
    status: 'success',
    data: { overall: overallStats, byDistrict: districtStats },
  });
});

module.exports = exports;
