const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Humanities_Data = db.humanitiesData;
const Humanities_Question = db.humanitiesQuestion;
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
    where: { type_of_exam: '011' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({ status: 'success', data: testMasters });
});

exports.getHumanitiesMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '011' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) return next(new AppError('Test not found', 404));

  const marks = await Humanities_Data.findAll({
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

exports.getHumanitiesQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const qbDetails = await Humanities_Question.findAll({
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

  const marks = await Humanities_Data.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'TOTAL4', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { economics: null, history: null, politicalScience: null, geography: null },
        byDistrict: [],
      },
    });
  }

  const economicsScores = marks.map((mark) => parseFloat(mark.TOTAL1));
  const historyScores = marks.map((mark) => parseFloat(mark.TOTAL2));
  const politicalScienceScores = marks.map((mark) => parseFloat(mark.TOTAL3));
  const geographyScores = marks.map((mark) => parseFloat(mark.TOTAL4));

  const overallStats = {
    economics: {
      average: calculateAverage(economicsScores).toFixed(2),
      median: calculateMedian(economicsScores).toFixed(2),
      count: marks.length,
    },
    history: {
      average: calculateAverage(historyScores).toFixed(2),
      median: calculateMedian(historyScores).toFixed(2),
      count: marks.length,
    },
    politicalScience: {
      average: calculateAverage(politicalScienceScores).toFixed(2),
      median: calculateMedian(politicalScienceScores).toFixed(2),
      count: marks.length,
    },
    geography: {
      average: calculateAverage(geographyScores).toFixed(2),
      median: calculateMedian(geographyScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = { economics: [], history: [], politicalScience: [], geography: [] };
      }
      districtGroups[district].economics.push(parseFloat(mark.TOTAL1));
      districtGroups[district].history.push(parseFloat(mark.TOTAL2));
      districtGroups[district].politicalScience.push(parseFloat(mark.TOTAL3));
      districtGroups[district].geography.push(parseFloat(mark.TOTAL4));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        economics: {
          average: calculateAverage(scores.economics).toFixed(2),
          median: calculateMedian(scores.economics).toFixed(2),
          count: scores.economics.filter((value) => value !== null && !isNaN(value)).length,
        },
        history: {
          average: calculateAverage(scores.history).toFixed(2),
          median: calculateMedian(scores.history).toFixed(2),
          count: scores.history.filter((value) => value !== null && !isNaN(value)).length,
        },
        politicalScience: {
          average: calculateAverage(scores.politicalScience).toFixed(2),
          median: calculateMedian(scores.politicalScience).toFixed(2),
          count: scores.politicalScience.filter((value) => value !== null && !isNaN(value)).length,
        },
        geography: {
          average: calculateAverage(scores.geography).toFixed(2),
          median: calculateMedian(scores.geography).toFixed(2),
          count: scores.geography.filter((value) => value !== null && !isNaN(value)).length,
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
