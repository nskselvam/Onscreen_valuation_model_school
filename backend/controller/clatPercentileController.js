const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const Clat_Master = db.clatMaster;
const District_Master = db.District_Master;
const sectionFields = ['TOTAL1', 'TOTAL2', 'TOTAL3', 'TOTAL4'];

const calculatePercentile = (score, sortedScores) => {
  if (score === null || score === undefined || sortedScores.length === 0) return null;

  let left = 0;
  let right = sortedScores.length - 1;
  let position = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (sortedScores[mid] <= score) {
      position = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return Number((((position + 1) / sortedScores.length) * 100).toFixed(7));
};

const getScores = (records, field) => records
  .map((record) => Number(record[field]))
  .filter((score) => Number.isFinite(score))
  .sort((a, b) => a - b);

const buildPercentileValues = (record, records, district = false) => {
  const result = {
    [district ? 'd_Total_Percentile' : 'Total_Percentile']: calculatePercentile(record.TOTAL, getScores(records, 'TOTAL')),
  };

  sectionFields.forEach((field, index) => {
    const scores = getScores(records, field);
    const percentileField = `${district ? 'd_' : ''}Total${index + 1}_Percentile`;
    result[percentileField] = scores.some((score) => score > 0)
      ? calculatePercentile(record[field], scores)
      : 0;
  });

  return result;
};

const getAllTestCodesWithDistricts = catchAsync(async (req, res) => {
  const [testCodes, districts] = await Promise.all([
    Clat_Master.findAll({
      attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('Test_Code')), 'Test_Code']],
      where: { Test_Code: { [Op.ne]: null } },
      order: [[db.sequelize.col('Test_Code'), 'ASC']],
      raw: true,
    }),
    District_Master.findAll({ attributes: ['DCODE', 'DNAME'], order: [['DCODE', 'ASC']], raw: true }),
  ]);

  const results = await Promise.all(testCodes.map(async ({ Test_Code: testCode }) => {
    const [districtRows, total, overallCalculated, districtCalculated] = await Promise.all([
      Clat_Master.findAll({
        attributes: [[db.sequelize.col('BATCHNAME'), 'BATCHNAME'], [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'studentCount']],
        where: { Test_Code: testCode, BATCHNAME: { [Op.ne]: null } },
        group: ['BATCHNAME'],
        raw: true,
      }),
      Clat_Master.count({ where: { Test_Code: testCode } }),
      Clat_Master.count({ where: { Test_Code: testCode, Total_Percentile: { [Op.ne]: null }, Total1_Percentile: { [Op.ne]: null }, Total2_Percentile: { [Op.ne]: null }, Total3_Percentile: { [Op.ne]: null }, Total4_Percentile: { [Op.ne]: null } } }),
      Clat_Master.count({ where: { Test_Code: testCode, d_Total_Percentile: { [Op.ne]: null }, d_Total1_Percentile: { [Op.ne]: null }, d_Total2_Percentile: { [Op.ne]: null }, d_Total3_Percentile: { [Op.ne]: null }, d_Total4_Percentile: { [Op.ne]: null } } }),
    ]);

    return {
      testCode,
      districts: districtRows.map((row) => ({
        districtCode: row.BATCHNAME,
        studentCount: Number(row.studentCount),
        districtName: districts.find((district) => district.DCODE === row.BATCHNAME)?.DNAME || row.BATCHNAME,
      })),
      isCalculated: total > 0 && overallCalculated === total && districtCalculated === total,
      calculationProgress: { total, overallCalculated, districtCalculated },
    };
  }));

  res.status(200).json({
    status: 'success',
    data: {
      testCodes: results.filter((result) => !result.isCalculated),
      completedTestCodes: results.filter((result) => result.isCalculated),
      allDistricts: districts,
    },
  });
});

const calculateOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const records = await Clat_Master.findAll({ where: { Test_Code: testCode, TOTAL: { [Op.ne]: null } }, raw: true });
  if (!records.length) return next(new AppError('No records found for this test code', 404));

  await Promise.all(records.map((record) => Clat_Master.update(
    buildPercentileValues(record, records),
    { where: { id: record.id } },
  )));

  res.status(200).json({ status: 'success', message: `Overall percentiles calculated successfully for test code ${testCode}`, data: { testCode, recordsProcessed: records.length } });
});

const calculateDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;
  if (!testCode || !districtCode) return next(new AppError('Test code and district code are required', 400));

  const records = await Clat_Master.findAll({ where: { Test_Code: testCode, BATCHNAME: districtCode, TOTAL: { [Op.ne]: null } }, raw: true });
  if (!records.length) return next(new AppError('No records found for this test code and district', 404));

  await Promise.all(records.map((record) => Clat_Master.update(
    buildPercentileValues(record, records, true),
    { where: { id: record.id } },
  )));

  res.status(200).json({ status: 'success', message: `District percentiles calculated successfully for test code ${testCode}, district ${districtCode}`, data: { testCode, districtCode, recordsProcessed: records.length } });
});

const calculateAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;
  if (!testCode) return next(new AppError('Test code is required', 400));

  const districts = await Clat_Master.findAll({
    attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('BATCHNAME')), 'BATCHNAME']],
    where: { Test_Code: testCode, BATCHNAME: { [Op.ne]: null } },
    raw: true,
  });
  if (!districts.length) return next(new AppError('No districts found for this test code', 404));

  let recordsProcessed = 0;
  for (const { BATCHNAME: districtCode } of districts) {
    const records = await Clat_Master.findAll({ where: { Test_Code: testCode, BATCHNAME: districtCode, TOTAL: { [Op.ne]: null } }, raw: true });
    await Promise.all(records.map((record) => Clat_Master.update(buildPercentileValues(record, records, true), { where: { id: record.id } })));
    recordsProcessed += records.length;
  }

  res.status(200).json({ status: 'success', message: `All district percentiles calculated successfully for test code ${testCode}`, data: { testCode, districtsProcessed: districts.length, recordsProcessed } });
});

const revokeOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;
  if (!testCode) return next(new AppError('Test code is required', 400));
  const [count] = await Clat_Master.update({ Total_Percentile: null, Total1_Percentile: null, Total2_Percentile: null, Total3_Percentile: null, Total4_Percentile: null }, { where: { Test_Code: testCode } });
  if (!count) return next(new AppError('No records found for this test code', 404));
  res.status(200).json({ status: 'success', message: `Overall percentiles revoked successfully for test code ${testCode}`, data: { testCode, recordsUpdated: count } });
});

const revokeDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;
  if (!testCode || !districtCode) return next(new AppError('Test code and district code are required', 400));
  const [count] = await Clat_Master.update({ d_Total_Percentile: null, d_Total1_Percentile: null, d_Total2_Percentile: null, d_Total3_Percentile: null, d_Total4_Percentile: null }, { where: { Test_Code: testCode, BATCHNAME: districtCode } });
  if (!count) return next(new AppError('No records found for this test code and district', 404));
  res.status(200).json({ status: 'success', message: `District percentiles revoked successfully for test code ${testCode}, district ${districtCode}`, data: { testCode, districtCode, recordsUpdated: count } });
});

const revokeAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;
  if (!testCode) return next(new AppError('Test code is required', 400));
  const [count] = await Clat_Master.update({ d_Total_Percentile: null, d_Total1_Percentile: null, d_Total2_Percentile: null, d_Total3_Percentile: null, d_Total4_Percentile: null }, { where: { Test_Code: testCode } });
  if (!count) return next(new AppError('No records found for this test code', 404));
  res.status(200).json({ status: 'success', message: `All district percentiles revoked successfully for test code ${testCode}`, data: { testCode, recordsUpdated: count } });
});

module.exports = {
  getAllTestCodesWithDistricts,
  calculateOverallPercentiles,
  calculateDistrictPercentiles,
  calculateAllDistrictsPercentiles,
  revokeOverallPercentiles,
  revokeDistrictPercentiles,
  revokeAllDistrictsPercentiles,
};
