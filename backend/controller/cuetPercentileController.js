const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const Cuet_Master = db.cuetMaster;
const District_Master = db.District_Master;

const getAllTestCodesWithDistricts = catchAsync(async (req, res) => {
  const testCodes = await Cuet_Master.findAll({
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
      const districtsWithData = await Cuet_Master.findAll({
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

      const overallCalculated = await Cuet_Master.count({
        where: {
          Test_Code: test.Test_Code,
          Total_Percentile: { [Op.ne]: null },
          Accountancy_Percentile: { [Op.ne]: null },
          Economics_Percentile: { [Op.ne]: null },
          Business_Studies_Commerce_Percentile: { [Op.ne]: null },
          Business_Maths_Percentile: { [Op.ne]: null },
        },
      });

      const districtCalculated = await Cuet_Master.count({
        where: {
          Test_Code: test.Test_Code,
          d_Total_Percentile: { [Op.ne]: null },
          d_Accountancy_Percentile: { [Op.ne]: null },
          d_Economics_Percentile: { [Op.ne]: null },
          d_Business_Studies_Commerce_Percentile: { [Op.ne]: null },
          d_Business_Maths_Percentile: { [Op.ne]: null },
        },
      });

      const totalRecords = await Cuet_Master.count({
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
          districtName: districts.find((dist) => dist.DCODE === d.BATCHNAME)?.DNAME || d.BATCHNAME,
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

  const countLessOrEqual = position + 1;
  const percentile = (countLessOrEqual / totalCount) * 100;

  return Number(percentile.toFixed(7));
};

const calculateOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const allRecords = await Cuet_Master.findAll({
    where: {
      Test_Code: testCode,
      TOTAL: { [Op.ne]: null },
    },
    raw: true,
  });

  if (allRecords.length === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const totalScores = allRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
  const accountancyScores = allRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
  const economicsScores = allRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);
  const businessStudiesCommerceScores = allRecords.map((r) => r.TOTAL3).filter((s) => s !== null).sort((a, b) => a - b);
  const businessMathsScores = allRecords.map((r) => r.TOTAL4).filter((s) => s !== null).sort((a, b) => a - b);

  const updates = allRecords.map((record) => {
    return Cuet_Master.update(
      {
        Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        Accountancy_Percentile: calculatePercentile(record.TOTAL1, accountancyScores),
        Economics_Percentile: calculatePercentile(record.TOTAL2, economicsScores),
        Business_Studies_Commerce_Percentile: calculatePercentile(record.TOTAL3, businessStudiesCommerceScores),
        Business_Maths_Percentile: calculatePercentile(record.TOTAL4, businessMathsScores),
      },
      {
        where: { id: record.id },
      }
    );
  });

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles calculated successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsProcessed: allRecords.length,
    },
  });
});

const calculateDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const districtRecords = await Cuet_Master.findAll({
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

  const totalScores = districtRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
  const accountancyScores = districtRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
  const economicsScores = districtRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);
  const businessStudiesCommerceScores = districtRecords.map((r) => r.TOTAL3).filter((s) => s !== null).sort((a, b) => a - b);
  const businessMathsScores = districtRecords.map((r) => r.TOTAL4).filter((s) => s !== null).sort((a, b) => a - b);

  const updates = districtRecords.map((record) => {
    return Cuet_Master.update(
      {
        d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        d_Accountancy_Percentile: calculatePercentile(record.TOTAL1, accountancyScores),
        d_Economics_Percentile: calculatePercentile(record.TOTAL2, economicsScores),
        d_Business_Studies_Commerce_Percentile: calculatePercentile(record.TOTAL3, businessStudiesCommerceScores),
        d_Business_Maths_Percentile: calculatePercentile(record.TOTAL4, businessMathsScores),
      },
      {
        where: { id: record.id },
      }
    );
  });

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: `District percentiles calculated successfully for test code ${testCode}, district ${districtCode}`,
    data: {
      testCode,
      districtCode,
      recordsProcessed: districtRecords.length,
    },
  });
});

const calculateAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const districts = await Cuet_Master.findAll({
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

    const districtRecords = await Cuet_Master.findAll({
      where: {
        Test_Code: testCode,
        BATCHNAME: districtCode,
        TOTAL: { [Op.ne]: null },
      },
      raw: true,
    });

    if (districtRecords.length === 0) continue;

    const totalScores = districtRecords.map((r) => r.TOTAL).filter((s) => s !== null).sort((a, b) => a - b);
    const accountancyScores = districtRecords.map((r) => r.TOTAL1).filter((s) => s !== null).sort((a, b) => a - b);
    const economicsScores = districtRecords.map((r) => r.TOTAL2).filter((s) => s !== null).sort((a, b) => a - b);
    const businessStudiesCommerceScores = districtRecords.map((r) => r.TOTAL3).filter((s) => s !== null).sort((a, b) => a - b);
    const businessMathsScores = districtRecords.map((r) => r.TOTAL4).filter((s) => s !== null).sort((a, b) => a - b);

    const updates = districtRecords.map((record) => {
      return Cuet_Master.update(
        {
          d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
          d_Accountancy_Percentile: calculatePercentile(record.TOTAL1, accountancyScores),
          d_Economics_Percentile: calculatePercentile(record.TOTAL2, economicsScores),
          d_Business_Studies_Commerce_Percentile: calculatePercentile(record.TOTAL3, businessStudiesCommerceScores),
          d_Business_Maths_Percentile: calculatePercentile(record.TOTAL4, businessMathsScores),
        },
        {
          where: { id: record.id },
        }
      );
    });

    await Promise.all(updates);
    totalProcessed += districtRecords.length;
  }

  res.status(200).json({
    status: 'success',
    message: `All district percentiles calculated successfully for test code ${testCode}`,
    data: {
      testCode,
      districtsProcessed: districts.length,
      recordsProcessed: totalProcessed,
    },
  });
});

const getPercentileStatus = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const totalRecords = await Cuet_Master.count({ where: { Test_Code: testCode } });

  if (totalRecords === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const overallCalculated = await Cuet_Master.count({
    where: {
      Test_Code: testCode,
      Total_Percentile: { [Op.ne]: null },
      Accountancy_Percentile: { [Op.ne]: null },
      Economics_Percentile: { [Op.ne]: null },
      Business_Studies_Commerce_Percentile: { [Op.ne]: null },
      Business_Maths_Percentile: { [Op.ne]: null },
    },
  });

  const districtCalculated = await Cuet_Master.count({
    where: {
      Test_Code: testCode,
      d_Total_Percentile: { [Op.ne]: null },
      d_Accountancy_Percentile: { [Op.ne]: null },
      d_Economics_Percentile: { [Op.ne]: null },
      d_Business_Studies_Commerce_Percentile: { [Op.ne]: null },
      d_Business_Maths_Percentile: { [Op.ne]: null },
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
      isFullyComplete: overallCalculated === totalRecords && districtCalculated === totalRecords,
    },
  });
});

const revokeOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await Cuet_Master.update(
    {
      Total_Percentile: null,
      Accountancy_Percentile: null,
      Economics_Percentile: null,
      Business_Studies_Commerce_Percentile: null,
      Business_Maths_Percentile: null,
    },
    {
      where: { Test_Code: testCode },
    }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles revoked successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsUpdated: updatedCount,
    },
  });
});

const revokeDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const [updatedCount] = await Cuet_Master.update(
    {
      d_Total_Percentile: null,
      d_Accountancy_Percentile: null,
      d_Economics_Percentile: null,
      d_Business_Studies_Commerce_Percentile: null,
      d_Business_Maths_Percentile: null,
    },
    {
      where: {
        Test_Code: testCode,
        BATCHNAME: districtCode,
      },
    }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code and district', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `District percentiles revoked successfully for test code ${testCode}, district ${districtCode}`,
    data: {
      testCode,
      districtCode,
      recordsUpdated: updatedCount,
    },
  });
});

const revokeAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await Cuet_Master.update(
    {
      d_Total_Percentile: null,
      d_Accountancy_Percentile: null,
      d_Economics_Percentile: null,
      d_Business_Studies_Commerce_Percentile: null,
      d_Business_Maths_Percentile: null,
    },
    {
      where: { Test_Code: testCode },
    }
  );

  if (updatedCount === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  res.status(200).json({
    status: 'success',
    message: `All district percentiles revoked successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsUpdated: updatedCount,
    },
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
