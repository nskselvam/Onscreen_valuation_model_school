const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const CurrentAffairs_Master = db.currentAffairsMaster;
const District_Master = db.District_Master;

// Binary search percentile: (candidates with score ≤ yours / total) × 100
const calculatePercentile = (score, sortedScores) => {
  if (score === null || score === undefined) return null;

  const totalCount = sortedScores.length;
  if (totalCount === 0) return null;

  let left = 0;
  let right = totalCount - 1;
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

  return Number((((position + 1) / totalCount) * 100).toFixed(7));
};

// GET /test-codes-with-districts
const getAllTestCodesWithDistricts = catchAsync(async (req, res) => {
  const testCodes = await CurrentAffairs_Master.findAll({
    attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('Test_Code')), 'Test_Code']],
    where: { Test_Code: { [Op.ne]: null } },
    order: [[db.sequelize.col('Test_Code'), 'ASC']],
    raw: true,
  });

  const districts = await District_Master.findAll({
    attributes: ['DCODE', 'DNAME'],
    order: [['DCODE', 'ASC']],
  });

  const testCodesWithDistricts = await Promise.all(
    testCodes.map(async (test) => {
      const districtsWithData = await CurrentAffairs_Master.findAll({
        attributes: [
          [db.sequelize.fn('DISTINCT', db.sequelize.col('BATCHNAME')), 'BATCHNAME'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'studentCount'],
        ],
        where: {
          Test_Code: test.Test_Code,
          BATCHNAME: { [Op.ne]: null },
        },
        group: ['BATCHNAME'],
        raw: true,
      });

      const overallCalculated = await CurrentAffairs_Master.count({
        where: {
          Test_Code: test.Test_Code,
          Total_Percentile: { [Op.ne]: null },
          Total1_Percentile: { [Op.ne]: null },
          Total2_Percentile: { [Op.ne]: null },
        },
      });

      const districtCalculated = await CurrentAffairs_Master.count({
        where: {
          Test_Code: test.Test_Code,
          d_Total_Percentile: { [Op.ne]: null },
          d_Total1_Percentile: { [Op.ne]: null },
          d_Total2_Percentile: { [Op.ne]: null },
        },
      });

      const totalRecords = await CurrentAffairs_Master.count({
        where: { Test_Code: test.Test_Code },
      });

      const isFullyCalculated =
        totalRecords > 0 &&
        overallCalculated === totalRecords &&
        districtCalculated === totalRecords;

      return {
        testCode: test.Test_Code,
        districts: districtsWithData.map((d) => ({
          districtCode: d.BATCHNAME,
          studentCount: parseInt(d.studentCount, 10),
          districtName:
            districts.find((dist) => dist.DCODE === d.BATCHNAME)?.DNAME || d.BATCHNAME,
        })),
        isCalculated: isFullyCalculated,
        calculationProgress: {
          total: totalRecords,
          overallCalculated,
          districtCalculated,
        },
      };
    })
  );

  const pendingTestCodes = testCodesWithDistricts.filter((t) => !t.isCalculated);
  const completedTestCodes = testCodesWithDistricts.filter((t) => t.isCalculated);

  res.status(200).json({
    status: 'success',
    data: {
      testCodes: pendingTestCodes,
      completedTestCodes,
      allDistricts: districts,
    },
  });
});

// GET /status/:testCode
const getPercentileStatus = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const totalRecords = await CurrentAffairs_Master.count({
    where: { Test_Code: testCode },
  });

  if (totalRecords === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const overallCalculated = await CurrentAffairs_Master.count({
    where: {
      Test_Code: testCode,
      Total_Percentile: { [Op.ne]: null },
      Total1_Percentile: { [Op.ne]: null },
      Total2_Percentile: { [Op.ne]: null },
    },
  });

  const districtCalculated = await CurrentAffairs_Master.count({
    where: {
      Test_Code: testCode,
      d_Total_Percentile: { [Op.ne]: null },
      d_Total1_Percentile: { [Op.ne]: null },
      d_Total2_Percentile: { [Op.ne]: null },
    },
  });

  res.status(200).json({
    status: 'success',
    data: {
      testCode,
      totalRecords,
      overallCalculated,
      districtCalculated,
      overallPercentage: ((overallCalculated / totalRecords) * 100).toFixed(2),
      districtPercentage: ((districtCalculated / totalRecords) * 100).toFixed(2),
      isOverallComplete: overallCalculated === totalRecords,
      isDistrictComplete: districtCalculated === totalRecords,
      isFullyComplete:
        overallCalculated === totalRecords && districtCalculated === totalRecords,
    },
  });
});

// POST /calculate-overall
const calculateOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const allRecords = await CurrentAffairs_Master.findAll({
    where: {
      Test_Code: testCode,
      TOTAL: { [Op.ne]: null },
    },
    raw: true,
  });

  if (allRecords.length === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const totalScores  = allRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
  const total1Scores = allRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
  const total2Scores = allRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);

  const updates = allRecords.map((record) =>
    CurrentAffairs_Master.update(
      {
        Total_Percentile:  calculatePercentile(record.TOTAL,  totalScores),
        Total1_Percentile: calculatePercentile(record.TOTAL1, total1Scores),
        Total2_Percentile: calculatePercentile(record.TOTAL2, total2Scores),
      },
      { where: { id: record.id } }
    )
  );

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles calculated successfully for test code ${testCode}`,
    data: { testCode, recordsProcessed: allRecords.length },
  });
});

// POST /calculate-district
const calculateDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const districtRecords = await CurrentAffairs_Master.findAll({
    where: {
      Test_Code: testCode,
      BATCHNAME: districtCode,
      TOTAL: { [Op.ne]: null },
    },
    raw: true,
  });

  if (districtRecords.length === 0) {
    return next(new AppError('No records found for this test code and district', 404));
  }

  const totalScores  = districtRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
  const total1Scores = districtRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
  const total2Scores = districtRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);

  const updates = districtRecords.map((record) =>
    CurrentAffairs_Master.update(
      {
        d_Total_Percentile:  calculatePercentile(record.TOTAL,  totalScores),
        d_Total1_Percentile: calculatePercentile(record.TOTAL1, total1Scores),
        d_Total2_Percentile: calculatePercentile(record.TOTAL2, total2Scores),
      },
      { where: { id: record.id } }
    )
  );

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: `District percentiles calculated successfully for test code ${testCode}, district ${districtCode}`,
    data: { testCode, districtCode, recordsProcessed: districtRecords.length },
  });
});

// POST /calculate-all-districts
const calculateAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const districts = await CurrentAffairs_Master.findAll({
    attributes: [[db.sequelize.fn('DISTINCT', db.sequelize.col('BATCHNAME')), 'BATCHNAME']],
    where: {
      Test_Code: testCode,
      BATCHNAME: { [Op.ne]: null },
    },
    raw: true,
  });

  if (districts.length === 0) {
    return next(new AppError('No districts found for this test code', 404));
  }

  let totalProcessed = 0;

  for (const district of districts) {
    const districtCode = district.BATCHNAME;

    const districtRecords = await CurrentAffairs_Master.findAll({
      where: {
        Test_Code: testCode,
        BATCHNAME: districtCode,
        TOTAL: { [Op.ne]: null },
      },
      raw: true,
    });

    if (districtRecords.length === 0) continue;

    const totalScores  = districtRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
    const total1Scores = districtRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
    const total2Scores = districtRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);

    const updates = districtRecords.map((record) =>
      CurrentAffairs_Master.update(
        {
          d_Total_Percentile:  calculatePercentile(record.TOTAL,  totalScores),
          d_Total1_Percentile: calculatePercentile(record.TOTAL1, total1Scores),
          d_Total2_Percentile: calculatePercentile(record.TOTAL2, total2Scores),
        },
        { where: { id: record.id } }
      )
    );

    await Promise.all(updates);
    totalProcessed += districtRecords.length;
  }

  res.status(200).json({
    status: 'success',
    message: `All district percentiles calculated successfully for test code ${testCode}`,
    data: { testCode, districtsProcessed: districts.length, recordsProcessed: totalProcessed },
  });
});

// POST /revoke-overall
const revokeOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await CurrentAffairs_Master.update(
    { Total_Percentile: null, Total1_Percentile: null, Total2_Percentile: null },
    { where: { Test_Code: testCode } }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles revoked successfully for test code ${testCode}`,
    data: { testCode, recordsUpdated: updatedCount },
  });
});

// POST /revoke-district
const revokeDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const [updatedCount] = await CurrentAffairs_Master.update(
    { d_Total_Percentile: null, d_Total1_Percentile: null, d_Total2_Percentile: null },
    { where: { Test_Code: testCode, BATCHNAME: districtCode } }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code and district', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `District percentiles revoked successfully for test code ${testCode}, district ${districtCode}`,
    data: { testCode, districtCode, recordsUpdated: updatedCount },
  });
});

// POST /revoke-all-districts
const revokeAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await CurrentAffairs_Master.update(
    { d_Total_Percentile: null, d_Total1_Percentile: null, d_Total2_Percentile: null },
    { where: { Test_Code: testCode } }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `All district percentiles revoked successfully for test code ${testCode}`,
    data: { testCode, recordsUpdated: updatedCount },
  });
});

module.exports = {
  getAllTestCodesWithDistricts,
  getPercentileStatus,
  calculateOverallPercentiles,
  calculateDistrictPercentiles,
  calculateAllDistrictsPercentiles,
  revokeOverallPercentiles,
  revokeDistrictPercentiles,
  revokeAllDistrictsPercentiles,
};
