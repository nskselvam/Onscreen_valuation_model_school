const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');

const SpokenEnglishMaster = db.spokenEnglisMaster;
const District_Master = db.District_Master;

const toSortedNumericScores = (records, fieldName) =>
  records
    .map((r) => Number(r[fieldName]))
    .filter((s) => !Number.isNaN(s))
    .sort((a, b) => a - b);

const hasAnyPositiveScore = (scores) => scores.some((s) => Number(s) > 0);

// Binary search percentile: (candidates with score <= yours / total) * 100
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

const getAllTestCodesWithDistricts = catchAsync(async (req, res) => {
  const testCodes = await SpokenEnglishMaster.findAll({
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
      const districtsWithData = await SpokenEnglishMaster.findAll({
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

      const overallCalculated = await SpokenEnglishMaster.count({
        where: {
          Test_Code: test.Test_Code,
          Total_Percentile: { [Op.ne]: null },
          listeningPerecentile: { [Op.ne]: null },
          speakingPerecentile: { [Op.ne]: null },
          readingPercentile: { [Op.ne]: null },
          writingPercetile: { [Op.ne]: null },
        },
      });

      const districtCalculated = await SpokenEnglishMaster.count({
        where: {
          Test_Code: test.Test_Code,
          d_Total_Percentile: { [Op.ne]: null },
          d_listeningPerecentile: { [Op.ne]: null },
          d_speakingPerecentile: { [Op.ne]: null },
          d_readingPercentile: { [Op.ne]: null },
          d_writingPercetile: { [Op.ne]: null },
        },
      });

      const totalRecords = await SpokenEnglishMaster.count({
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

const getPercentileStatus = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const totalRecords = await SpokenEnglishMaster.count({ where: { Test_Code: testCode } });

  if (totalRecords === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const overallCalculated = await SpokenEnglishMaster.count({
    where: {
      Test_Code: testCode,
      Total_Percentile: { [Op.ne]: null },
      listeningPerecentile: { [Op.ne]: null },
      speakingPerecentile: { [Op.ne]: null },
      readingPercentile: { [Op.ne]: null },
      writingPercetile: { [Op.ne]: null },
    },
  });

  const districtCalculated = await SpokenEnglishMaster.count({
    where: {
      Test_Code: testCode,
      d_Total_Percentile: { [Op.ne]: null },
      d_listeningPerecentile: { [Op.ne]: null },
      d_speakingPerecentile: { [Op.ne]: null },
      d_readingPercentile: { [Op.ne]: null },
      d_writingPercetile: { [Op.ne]: null },
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

const calculateOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const allRecords = await SpokenEnglishMaster.findAll({
    where: {
      Test_Code: testCode,
      TOTAL: { [Op.ne]: null },
    },
    raw: true,
  });

  if (allRecords.length === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  const totalScores = toSortedNumericScores(allRecords, 'TOTAL');
  const listeningScores = toSortedNumericScores(allRecords, 'TOTAL1');
  const speakingScores = toSortedNumericScores(allRecords, 'TOTAL2');
  const readingScores = toSortedNumericScores(allRecords, 'TOTAL3');
  const writingScores = toSortedNumericScores(allRecords, 'TOTAL4');

  const hasListeningData = hasAnyPositiveScore(listeningScores);
  const hasSpeakingData = hasAnyPositiveScore(speakingScores);
  const hasReadingData = hasAnyPositiveScore(readingScores);
  const hasWritingData = hasAnyPositiveScore(writingScores);

  const updates = allRecords.map((record) =>
    SpokenEnglishMaster.update(
      {
        Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        listeningPerecentile: hasListeningData
          ? calculatePercentile(record.TOTAL1, listeningScores)
          : 0,
        speakingPerecentile: hasSpeakingData
          ? calculatePercentile(record.TOTAL2, speakingScores)
          : 0,
        readingPercentile: hasReadingData
          ? calculatePercentile(record.TOTAL3, readingScores)
          : 0,
        writingPercetile: hasWritingData
          ? calculatePercentile(record.TOTAL4, writingScores)
          : 0,
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

const calculateDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const districtRecords = await SpokenEnglishMaster.findAll({
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

  const totalScores = toSortedNumericScores(districtRecords, 'TOTAL');
  const listeningScores = toSortedNumericScores(districtRecords, 'TOTAL1');
  const speakingScores = toSortedNumericScores(districtRecords, 'TOTAL2');
  const readingScores = toSortedNumericScores(districtRecords, 'TOTAL3');
  const writingScores = toSortedNumericScores(districtRecords, 'TOTAL4');

  const hasListeningData = hasAnyPositiveScore(listeningScores);
  const hasSpeakingData = hasAnyPositiveScore(speakingScores);
  const hasReadingData = hasAnyPositiveScore(readingScores);
  const hasWritingData = hasAnyPositiveScore(writingScores);

  const updates = districtRecords.map((record) =>
    SpokenEnglishMaster.update(
      {
        d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        d_listeningPerecentile: hasListeningData
          ? calculatePercentile(record.TOTAL1, listeningScores)
          : 0,
        d_speakingPerecentile: hasSpeakingData
          ? calculatePercentile(record.TOTAL2, speakingScores)
          : 0,
        d_readingPercentile: hasReadingData
          ? calculatePercentile(record.TOTAL3, readingScores)
          : 0,
        d_writingPercetile: hasWritingData
          ? calculatePercentile(record.TOTAL4, writingScores)
          : 0,
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

const calculateAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const districts = await SpokenEnglishMaster.findAll({
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

    const districtRecords = await SpokenEnglishMaster.findAll({
      where: {
        Test_Code: testCode,
        BATCHNAME: districtCode,
        TOTAL: { [Op.ne]: null },
      },
      raw: true,
    });

    if (districtRecords.length === 0) continue;

    const totalScores = toSortedNumericScores(districtRecords, 'TOTAL');
    const listeningScores = toSortedNumericScores(districtRecords, 'TOTAL1');
    const speakingScores = toSortedNumericScores(districtRecords, 'TOTAL2');
    const readingScores = toSortedNumericScores(districtRecords, 'TOTAL3');
    const writingScores = toSortedNumericScores(districtRecords, 'TOTAL4');

    const hasListeningData = hasAnyPositiveScore(listeningScores);
    const hasSpeakingData = hasAnyPositiveScore(speakingScores);
    const hasReadingData = hasAnyPositiveScore(readingScores);
    const hasWritingData = hasAnyPositiveScore(writingScores);

    const updates = districtRecords.map((record) =>
      SpokenEnglishMaster.update(
        {
          d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
          d_listeningPerecentile: hasListeningData
            ? calculatePercentile(record.TOTAL1, listeningScores)
            : 0,
          d_speakingPerecentile: hasSpeakingData
            ? calculatePercentile(record.TOTAL2, speakingScores)
            : 0,
          d_readingPercentile: hasReadingData
            ? calculatePercentile(record.TOTAL3, readingScores)
            : 0,
          d_writingPercetile: hasWritingData
            ? calculatePercentile(record.TOTAL4, writingScores)
            : 0,
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

const revokeOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await SpokenEnglishMaster.update(
    {
      Total_Percentile: null,
      listeningPerecentile: null,
      speakingPerecentile: null,
      readingPercentile: null,
      writingPercetile: null,
    },
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

const revokeDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  const [updatedCount] = await SpokenEnglishMaster.update(
    {
      d_Total_Percentile: null,
      d_listeningPerecentile: null,
      d_speakingPerecentile: null,
      d_readingPercentile: null,
      d_writingPercetile: null,
    },
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

const revokeAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  const [updatedCount] = await SpokenEnglishMaster.update(
    {
      d_Total_Percentile: null,
      d_listeningPerecentile: null,
      d_speakingPerecentile: null,
      d_readingPercentile: null,
      d_writingPercetile: null,
    },
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
