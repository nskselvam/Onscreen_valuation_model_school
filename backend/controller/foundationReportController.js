const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Foundation_Master = db.foundationMaster;
const Foundation_Question = db.foundationQuestion;
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
  districts.forEach((d) => {
    map[d.DCODE] = d.DNAME;
  });
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

exports.getTestCodesForReport = catchAsync(async (req, res) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '008' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({ status: 'success', data: testMasters });
});

exports.getFoundationMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '008' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) return next(new AppError('Test not found', 404));

  const marks = await Foundation_Master.findAll({
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

exports.getFoundationQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const qbDetails = await Foundation_Question.findAll({
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

exports.getSubjectWiseStatsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  const { districtCode } = req.query;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const whereClause = { Test_Code: testCode };
  if (districtCode) whereClause.BATCHNAME = districtCode;

  const marks = await Foundation_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { physics: null, chemistry: null, biology: null },
        byDistrict: [],
      },
    });
  }

  const phyScores = marks.map((m) => parseFloat(m.TOTAL1));
  const cheScores = marks.map((m) => parseFloat(m.TOTAL2));
  const bioScores = marks.map((m) => parseFloat(m.TOTAL3));

  const overallStats = {
    physics: {
      average: calculateAverage(phyScores).toFixed(2),
      median: calculateMedian(phyScores).toFixed(2),
      count: marks.length,
    },
    chemistry: {
      average: calculateAverage(cheScores).toFixed(2),
      median: calculateMedian(cheScores).toFixed(2),
      count: marks.length,
    },
    biology: {
      average: calculateAverage(bioScores).toFixed(2),
      median: calculateMedian(bioScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const d = mark.BATCHNAME;
      if (!districtGroups[d]) districtGroups[d] = { physics: [], chemistry: [], biology: [] };
      districtGroups[d].physics.push(parseFloat(mark.TOTAL1));
      districtGroups[d].chemistry.push(parseFloat(mark.TOTAL2));
      districtGroups[d].biology.push(parseFloat(mark.TOTAL3));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        physics: {
          average: calculateAverage(scores.physics).toFixed(2),
          median: calculateMedian(scores.physics).toFixed(2),
          count: scores.physics.filter((v) => v !== null && !isNaN(v)).length,
        },
        chemistry: {
          average: calculateAverage(scores.chemistry).toFixed(2),
          median: calculateMedian(scores.chemistry).toFixed(2),
          count: scores.chemistry.filter((v) => v !== null && !isNaN(v)).length,
        },
        biology: {
          average: calculateAverage(scores.biology).toFixed(2),
          median: calculateMedian(scores.biology).toFixed(2),
          count: scores.biology.filter((v) => v !== null && !isNaN(v)).length,
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
