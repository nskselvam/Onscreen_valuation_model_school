const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const GeneralAbility_Data = db.generalAbilityData;
const GeneralAbility_Question = db.generalAbilityQuestion;
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
  districts.forEach((district) => {
    map[district.DCODE] = district.DNAME;
  });
  return map;
};

const calculateMedian = (values) => {
  const sorted = values.filter((value) => value !== null && !isNaN(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
};

const calculateAverage = (values) => {
  const filtered = values.filter((value) => value !== null && !isNaN(value));
  if (filtered.length === 0) return 0;
  return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
};

exports.getTestCodesForReport = catchAsync(async (req, res) => {
  const testMasters = await Test_Master.findAll({
    where: { type_of_exam: '009' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({ status: 'success', data: testMasters });
});

exports.getGeneralAbilityMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '009' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) return next(new AppError('Test not found', 404));

  const marks = await GeneralAbility_Data.findAll({
    where: { Test_Code: testCode },
    order: [['TOTAL', 'DESC']],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({ status: 'success', data: { testMaster, marks: [], count: 0 } });
  }

  const districtCodes = [...new Set(marks.map((mark) => mark.BATCHNAME).filter(Boolean))];
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

exports.getGeneralAbilityQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const qbDetails = await GeneralAbility_Question.findAll({
    where: { Test_Code: testCode },
    order: [['BATCHNAME', 'ASC'], ['Qno', 'ASC']],
    raw: true,
  });

  const districtCodes = [...new Set(qbDetails.map((question) => question.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedQbDetails = qbDetails.map((question) => ({
    ...question,
    District_Name: districtMap[question.BATCHNAME] || question.BATCHNAME,
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

  const marks = await GeneralAbility_Data.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { verbalAbility: null, gkCurrentAffairs: null, quants: null },
        byDistrict: [],
      },
    });
  }

  const verbalScores = marks.map((mark) => parseFloat(mark.TOTAL1));
  const gkScores = marks.map((mark) => parseFloat(mark.TOTAL2));
  const quantsScores = marks.map((mark) => parseFloat(mark.TOTAL3));

  const overallStats = {
    verbalAbility: {
      average: calculateAverage(verbalScores).toFixed(2),
      median: calculateMedian(verbalScores).toFixed(2),
      count: marks.length,
    },
    gkCurrentAffairs: {
      average: calculateAverage(gkScores).toFixed(2),
      median: calculateMedian(gkScores).toFixed(2),
      count: marks.length,
    },
    quants: {
      average: calculateAverage(quantsScores).toFixed(2),
      median: calculateMedian(quantsScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = { verbalAbility: [], gkCurrentAffairs: [], quants: [] };
      }
      districtGroups[district].verbalAbility.push(parseFloat(mark.TOTAL1));
      districtGroups[district].gkCurrentAffairs.push(parseFloat(mark.TOTAL2));
      districtGroups[district].quants.push(parseFloat(mark.TOTAL3));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        verbalAbility: {
          average: calculateAverage(scores.verbalAbility).toFixed(2),
          median: calculateMedian(scores.verbalAbility).toFixed(2),
          count: scores.verbalAbility.filter((value) => value !== null && !isNaN(value)).length,
        },
        gkCurrentAffairs: {
          average: calculateAverage(scores.gkCurrentAffairs).toFixed(2),
          median: calculateMedian(scores.gkCurrentAffairs).toFixed(2),
          count: scores.gkCurrentAffairs.filter((value) => value !== null && !isNaN(value)).length,
        },
        quants: {
          average: calculateAverage(scores.quants).toFixed(2),
          median: calculateMedian(scores.quants).toFixed(2),
          count: scores.quants.filter((value) => value !== null && !isNaN(value)).length,
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