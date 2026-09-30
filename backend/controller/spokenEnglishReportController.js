const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const SpokenEnglish_Master = db.spokenEnglisMaster;
const SpokenEnglish_Qb = db.spoken_english_qb_details;
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
    where: { type_of_exam: '010' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({ status: 'success', data: testMasters });
});

exports.getSpokenEnglishMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const testMaster = await Test_Master.findOne({
    where: { testcode: testCode, type_of_exam: '010' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) return next(new AppError('Test not found', 404));

  const marks = await SpokenEnglish_Master.findAll({
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

exports.getSpokenEnglishQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const qbDetails = await SpokenEnglish_Qb.findAll({
    where: { Test_Code: testCode },
    order: [['D_CODE', 'ASC'], ['Qno', 'ASC']],
    raw: true,
  });

  const districtCodes = [...new Set(qbDetails.map((q) => q.D_CODE).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedQbDetails = qbDetails.map((qb) => ({
    ...qb,
    BATCHNAME: qb.D_CODE,
    District_Name: districtMap[qb.D_CODE] || qb.D_CODE,
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

  const marks = await SpokenEnglish_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL1', 'TOTAL2', 'TOTAL3', 'TOTAL4', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { listening: null, speaking: null, reading: null, writing: null },
        byDistrict: [],
      },
    });
  }

  const listeningScores = marks.map((m) => parseFloat(m.TOTAL1));
  const speakingScores = marks.map((m) => parseFloat(m.TOTAL2));
  const readingScores = marks.map((m) => parseFloat(m.TOTAL3));
  const writingScores = marks.map((m) => parseFloat(m.TOTAL4));

  const overallStats = {
    listening: {
      average: calculateAverage(listeningScores).toFixed(2),
      median: calculateMedian(listeningScores).toFixed(2),
      count: marks.length,
    },
    speaking: {
      average: calculateAverage(speakingScores).toFixed(2),
      median: calculateMedian(speakingScores).toFixed(2),
      count: marks.length,
    },
    reading: {
      average: calculateAverage(readingScores).toFixed(2),
      median: calculateMedian(readingScores).toFixed(2),
      count: marks.length,
    },
    writing: {
      average: calculateAverage(writingScores).toFixed(2),
      median: calculateMedian(writingScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};

    marks.forEach((mark) => {
      const d = mark.BATCHNAME;
      if (!districtGroups[d]) {
        districtGroups[d] = { listening: [], speaking: [], reading: [], writing: [] };
      }
      districtGroups[d].listening.push(parseFloat(mark.TOTAL1));
      districtGroups[d].speaking.push(parseFloat(mark.TOTAL2));
      districtGroups[d].reading.push(parseFloat(mark.TOTAL3));
      districtGroups[d].writing.push(parseFloat(mark.TOTAL4));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        listening: {
          average: calculateAverage(scores.listening).toFixed(2),
          median: calculateMedian(scores.listening).toFixed(2),
          count: scores.listening.filter((v) => v !== null && !isNaN(v)).length,
        },
        speaking: {
          average: calculateAverage(scores.speaking).toFixed(2),
          median: calculateMedian(scores.speaking).toFixed(2),
          count: scores.speaking.filter((v) => v !== null && !isNaN(v)).length,
        },
        reading: {
          average: calculateAverage(scores.reading).toFixed(2),
          median: calculateMedian(scores.reading).toFixed(2),
          count: scores.reading.filter((v) => v !== null && !isNaN(v)).length,
        },
        writing: {
          average: calculateAverage(scores.writing).toFixed(2),
          median: calculateMedian(scores.writing).toFixed(2),
          count: scores.writing.filter((v) => v !== null && !isNaN(v)).length,
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
