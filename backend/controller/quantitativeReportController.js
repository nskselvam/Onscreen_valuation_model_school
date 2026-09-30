const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Quantitative_Master = db.quantitativeMaster;
const Quantitative_Question = db.quantitativeQuestion;
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
    where: { type_of_exam: '005' },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions'],
    order: [['testcode', 'DESC']],
  });

  res.status(200).json({ status: 'success', data: testMasters });
});

exports.getQuantitativeMarksByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const testMaster = await Test_Master.findOne({
    where: {
      testcode: testCode,
      type_of_exam: '005',
    },
    attributes: ['testcode', 'Test_Name', 'std', 'testdate', 'sessions', 'type_of_exam'],
  });

  if (!testMaster) {
    return next(new AppError('Test not found', 404));
  }

  const marks = await Quantitative_Master.findAll({
    where: { Test_Code: testCode },
    order: [['TOTAL', 'DESC']],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        testMaster,
        marks: [],
        count: 0,
      },
    });
  }

  const districtCodes = [...new Set(marks.map((mark) => mark.BATCHNAME).filter(Boolean))];
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

exports.getQuantitativeQbDetailsByTestCode = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const qbDetails = await Quantitative_Question.findAll({
    where: { Test_Code: testCode },
    order: [
      ['BATCHNAME', 'ASC'],
      ['Qno', 'ASC'],
    ],
    raw: true,
  });

  if (qbDetails.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        qbDetails: [],
        count: 0,
      },
    });
  }

  const districtCodes = [...new Set(qbDetails.map((item) => item.BATCHNAME).filter(Boolean))];
  const districtMap = await buildDistrictMap(districtCodes);

  const enrichedQbDetails = qbDetails.map((item) => ({
    ...item,
    District_Name: districtMap[item.BATCHNAME] || item.BATCHNAME,
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

  const marks = await Quantitative_Master.findAll({
    where: whereClause,
    attributes: ['TOTAL', 'BATCHNAME'],
    raw: true,
  });

  if (marks.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        overall: { quantitativeAptitude: null },
        byDistrict: [],
      },
    });
  }

  const totalScores = marks.map((mark) => parseFloat(mark.TOTAL));

  const overallStats = {
    quantitativeAptitude: {
      average: calculateAverage(totalScores).toFixed(2),
      median: calculateMedian(totalScores).toFixed(2),
      count: marks.length,
    },
  };

  let districtStats = [];
  if (!districtCode) {
    const districtGroups = {};
    marks.forEach((mark) => {
      const district = mark.BATCHNAME;
      if (!districtGroups[district]) {
        districtGroups[district] = { quantitativeAptitude: [] };
      }
      districtGroups[district].quantitativeAptitude.push(parseFloat(mark.TOTAL));
    });

    const districtCodes = Object.keys(districtGroups);
    const districtMap = await buildDistrictMap(districtCodes);

    districtStats = Object.entries(districtGroups)
      .map(([code, scores]) => ({
        districtCode: code,
        districtName: districtMap[code] || code,
        quantitativeAptitude: {
          average: calculateAverage(scores.quantitativeAptitude).toFixed(2),
          median: calculateMedian(scores.quantitativeAptitude).toFixed(2),
          count: scores.quantitativeAptitude.filter((value) => value !== null && !isNaN(value)).length,
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

module.exports = exports;
