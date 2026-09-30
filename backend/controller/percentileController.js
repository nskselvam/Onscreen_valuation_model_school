const db = require('../db/models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { Op } = require('sequelize');
const Jee_Marks = db.Jee_Marks;
const District_Master = db.District_Master;

// Get all test codes with their district information
const getAllTestCodesWithDistricts = catchAsync(async (req, res, next) => {
  // Get distinct test codes from jee_marks
  const testCodes = await Jee_Marks.findAll({
    attributes: [
      [db.sequelize.fn('DISTINCT', db.sequelize.col('Test_Code')), 'Test_Code']
    ],
    where: {
      Test_Code: { [Op.ne]: null }
    },
    order: [[db.sequelize.col('Test_Code'), 'ASC']],
    raw: true
  });

  // Get all districts
  const districts = await District_Master.findAll({
    attributes: ['DCODE', 'DNAME'],
    order: [['DCODE', 'ASC']]
  });

  // For each test code, get the districts that have data and check calculation status
  const testCodesWithDistricts = await Promise.all(
    testCodes.map(async (test) => {
      const districtsWithData = await Jee_Marks.findAll({
        attributes: [
          [db.sequelize.fn('DISTINCT', db.sequelize.col('BATCHNAME')), 'BATCHNAME'],
          [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'studentCount']
        ],
        where: {
          Test_Code: test.Test_Code,
          BATCHNAME: { [Op.ne]: null }
        },
        group: ['BATCHNAME'],
        raw: true
      });

      // Check if all percentiles are calculated for this test code
      const totalRecords = await Jee_Marks.count({
        where: {
          Test_Code: test.Test_Code
        }
      });

      // Check overall percentiles calculated
      const overallCalculated = await Jee_Marks.count({
        where: {
          Test_Code: test.Test_Code,
          Total_Percentile: { [Op.ne]: null },
          Phy_Percentile: { [Op.ne]: null },
          Che_Percentile: { [Op.ne]: null },
          Mat_Percentile: { [Op.ne]: null }
        }
      });

      // Check district percentiles calculated
      const districtCalculated = await Jee_Marks.count({
        where: {
          Test_Code: test.Test_Code,
          d_Total_Percentile: { [Op.ne]: null },
          d_Phy_Percentile: { [Op.ne]: null },
          d_Che_Percentile: { [Op.ne]: null },
          d_Mat_Percentile: { [Op.ne]: null }
        }
      });

      const isFullyCalculated = 
        totalRecords > 0 && 
        overallCalculated === totalRecords && 
        districtCalculated === totalRecords;

      return {
        testCode: test.Test_Code,
        districts: districtsWithData.map(d => ({
          districtCode: d.BATCHNAME,
          studentCount: parseInt(d.studentCount),
          districtName: districts.find(dist => dist.DCODE === d.BATCHNAME)?.DNAME || d.BATCHNAME
        })),
        isCalculated: isFullyCalculated,
        calculationProgress: {
          total: totalRecords,
          overallCalculated,
          districtCalculated
        }
      };
    })
  );

  // Separate pending and completed test codes
  const pendingTestCodes = testCodesWithDistricts.filter(t => !t.isCalculated);
  const completedTestCodes = testCodesWithDistricts.filter(t => t.isCalculated);

  res.status(200).json({
    status: 'success',
    data: {
      testCodes: pendingTestCodes,
      completedTestCodes: completedTestCodes,
      allDistricts: districts
    }
  });
});

// Calculate percentile using NTA/JEE formula with binary search optimization
// Formula: (Number of candidates with score ≤ yours / Total candidates) × 100
// Time Complexity: O(log N) instead of O(N) using binary search
const calculatePercentile = (score, sortedScores) => {
  if (score === null || score === undefined) return null;
  
  const totalCount = sortedScores.length;
  if (totalCount === 0) return null;
  
  // Binary search to find the rightmost position where score <= target
  // This gives us the count of students with score <= given score
  let left = 0;
  let right = totalCount - 1;
  let position = -1;
  
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (sortedScores[mid] <= score) {
      position = mid;
      left = mid + 1; // Continue searching right to find the last occurrence
    } else {
      right = mid - 1;
    }
  }
  
  // Count of students with score <= given score
  const countLessOrEqual = position + 1;
  
  // NTA/JEE Percentile formula: (Count ≤ score / Total) × 100
  const percentile = (countLessOrEqual / totalCount) * 100;
  
  // NTA publishes percentiles with 7 decimal places precision
  return Number(percentile.toFixed(7));
};

// Calculate overall percentiles for a test code (across all districts)
const calculateOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get all records for this test code
  const allRecords = await Jee_Marks.findAll({
    where: {
      Test_Code: testCode,
      TOTAL: { [Op.ne]: null }
    },
    raw: true
  });

  if (allRecords.length === 0) {
    return next(new AppError('No records found for this test code', 404));
  }

  // Get sorted scores for each subject
  const totalScores = allRecords.map(r => r.TOTAL).filter(s => s !== null).sort((a, b) => a - b);
  const phyScores = allRecords.map(r => r.Phy_Tot).filter(s => s !== null).sort((a, b) => a - b);
  const cheScores = allRecords.map(r => r.che_Tot).filter(s => s !== null).sort((a, b) => a - b);
  const matScores = allRecords.map(r => r.Mat_Tot).filter(s => s !== null).sort((a, b) => a - b);

  // Calculate percentiles for each record
  const updates = allRecords.map(record => {
    return Jee_Marks.update(
      {
        Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        Phy_Percentile: calculatePercentile(record.Phy_Tot, phyScores),
        Che_Percentile: calculatePercentile(record.che_Tot, cheScores),
        Mat_Percentile: calculatePercentile(record.Mat_Tot, matScores)
      },
      {
        where: { id: record.id }
      }
    );
  });

  await Promise.all(updates);

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles calculated successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsProcessed: allRecords.length
    }
  });
});

// Calculate district-specific percentiles for a test code and district
const calculateDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  // Get all records for this test code and district
  const districtRecords = await Jee_Marks.findAll({
    where: {
      Test_Code: testCode,
      BATCHNAME: districtCode,
      TOTAL: { [Op.ne]: null }
    },
    raw: true
  });

  if (districtRecords.length === 0) {
    return next(new AppError('No records found for this test code and district', 404));
  }

  // Get sorted scores for each subject within this district
  const totalScores = districtRecords.map(r => r.TOTAL).filter(s => s !== null).sort((a, b) => a - b);
  const phyScores = districtRecords.map(r => r.Phy_Tot).filter(s => s !== null).sort((a, b) => a - b);
  const cheScores = districtRecords.map(r => r.che_Tot).filter(s => s !== null).sort((a, b) => a - b);
  const matScores = districtRecords.map(r => r.Mat_Tot).filter(s => s !== null).sort((a, b) => a - b);

  // Calculate district-specific percentiles for each record
  const updates = districtRecords.map(record => {
    return Jee_Marks.update(
      {
        d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
        d_Phy_Percentile: calculatePercentile(record.Phy_Tot, phyScores),
        d_Che_Percentile: calculatePercentile(record.che_Tot, cheScores),
        d_Mat_Percentile: calculatePercentile(record.Mat_Tot, matScores)
      },
      {
        where: { id: record.id }
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
      recordsProcessed: districtRecords.length
    }
  });
});

// Calculate district percentiles for all districts in a test code
const calculateAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Get all distinct districts for this test code
  const districts = await Jee_Marks.findAll({
    attributes: [
      [db.sequelize.fn('DISTINCT', db.sequelize.col('BATCHNAME')), 'BATCHNAME']
    ],
    where: {
      Test_Code: testCode,
      BATCHNAME: { [Op.ne]: null }
    },
    raw: true
  });

  if (districts.length === 0) {
    return next(new AppError('No districts found for this test code', 404));
  }

  // Calculate percentiles for each district
  const results = await Promise.all(
    districts.map(async (dist) => {
      const districtCode = dist.BATCHNAME;
      
      // Get all records for this district
      const districtRecords = await Jee_Marks.findAll({
        where: {
          Test_Code: testCode,
          BATCHNAME: districtCode,
          TOTAL: { [Op.ne]: null }
        },
        raw: true
      });

      if (districtRecords.length === 0) return null;

      // Get sorted scores for each subject within this district
      const totalScores = districtRecords.map(r => r.TOTAL).filter(s => s !== null).sort((a, b) => a - b);
      const phyScores = districtRecords.map(r => r.Phy_Tot).filter(s => s !== null).sort((a, b) => a - b);
      const cheScores = districtRecords.map(r => r.che_Tot).filter(s => s !== null).sort((a, b) => a - b);
      const matScores = districtRecords.map(r => r.Mat_Tot).filter(s => s !== null).sort((a, b) => a - b);

      // Calculate district-specific percentiles for each record
      const updates = districtRecords.map(record => {
        return Jee_Marks.update(
          {
            d_Total_Percentile: calculatePercentile(record.TOTAL, totalScores),
            d_Phy_Percentile: calculatePercentile(record.Phy_Tot, phyScores),
            d_Che_Percentile: calculatePercentile(record.che_Tot, cheScores),
            d_Mat_Percentile: calculatePercentile(record.Mat_Tot, matScores)
          },
          {
            where: { id: record.id }
          }
        );
      });

      await Promise.all(updates);

      return {
        districtCode,
        recordsProcessed: districtRecords.length
      };
    })
  );

  const successfulResults = results.filter(r => r !== null);

  res.status(200).json({
    status: 'success',
    message: `District percentiles calculated successfully for all districts in test code ${testCode}`,
    data: {
      testCode,
      districtsProcessed: successfulResults.length,
      districts: successfulResults
    }
  });
});

// Get percentile calculation status for a test code
const getPercentileStatus = catchAsync(async (req, res, next) => {
  const { testCode } = req.params;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Check overall percentiles
  const overallCount = await Jee_Marks.count({
    where: {
      Test_Code: testCode,
      Total_Percentile: { [Op.ne]: null }
    }
  });

  const totalCount = await Jee_Marks.count({
    where: {
      Test_Code: testCode
    }
  });

  // Get district-wise percentile status
  const districts = await Jee_Marks.findAll({
    attributes: [
      'BATCHNAME',
      [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'totalStudents'],
      [
        db.sequelize.fn(
          'SUM',
          db.sequelize.literal('CASE WHEN "d_Total_Percentile" IS NOT NULL THEN 1 ELSE 0 END')
        ),
        'percentileCalculated'
      ]
    ],
    where: {
      Test_Code: testCode,
      BATCHNAME: { [Op.ne]: null }
    },
    group: ['BATCHNAME'],
    raw: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      testCode,
      overall: {
        total: totalCount,
        calculated: overallCount,
        percentage: totalCount > 0 ? Math.round((overallCount / totalCount) * 100) : 0
      },
      districts: districts.map(d => ({
        districtCode: d.BATCHNAME,
        total: parseInt(d.totalStudents),
        calculated: parseInt(d.percentileCalculated),
        percentage: parseInt(d.totalStudents) > 0 
          ? Math.round((parseInt(d.percentileCalculated) / parseInt(d.totalStudents)) * 100) 
          : 0
      }))
    }
  });
});

// Revoke overall percentiles for a test code (set to NULL)
const revokeOverallPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Update all records to set overall percentiles to NULL
  const result = await Jee_Marks.update(
    {
      Total_Percentile: null,
      Phy_Percentile: null,
      Che_Percentile: null,
      Mat_Percentile: null
    },
    {
      where: {
        Test_Code: testCode
      }
    }
  );

  res.status(200).json({
    status: 'success',
    message: `Overall percentiles revoked successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsAffected: result[0]
    }
  });
});

// Revoke district-specific percentiles for a test code and district
const revokeDistrictPercentiles = catchAsync(async (req, res, next) => {
  const { testCode, districtCode } = req.body;

  if (!testCode || !districtCode) {
    return next(new AppError('Test code and district code are required', 400));
  }

  // Update records for this district to set district percentiles to NULL
  const result = await Jee_Marks.update(
    {
      d_Total_Percentile: null,
      d_Phy_Percentile: null,
      d_Che_Percentile: null,
      d_Mat_Percentile: null
    },
    {
      where: {
        Test_Code: testCode,
        BATCHNAME: districtCode
      }
    }
  );

  res.status(200).json({
    status: 'success',
    message: `District percentiles revoked successfully for test code ${testCode}, district ${districtCode}`,
    data: {
      testCode,
      districtCode,
      recordsAffected: result[0]
    }
  });
});

// Revoke all district percentiles for a test code
const revokeAllDistrictsPercentiles = catchAsync(async (req, res, next) => {
  const { testCode } = req.body;

  if (!testCode) {
    return next(new AppError('Test code is required', 400));
  }

  // Update all records to set district percentiles to NULL
  const result = await Jee_Marks.update(
    {
      d_Total_Percentile: null,
      d_Phy_Percentile: null,
      d_Che_Percentile: null,
      d_Mat_Percentile: null
    },
    {
      where: {
        Test_Code: testCode
      }
    }
  );

  res.status(200).json({
    status: 'success',
    message: `All district percentiles revoked successfully for test code ${testCode}`,
    data: {
      testCode,
      recordsAffected: result[0]
    }
  });
});

module.exports = {
  getAllTestCodesWithDistricts,
  calculateOverallPercentiles,
  calculateDistrictPercentiles,
  calculateAllDistrictsPercentiles,
  getPercentileStatus,
  revokeOverallPercentiles,
  revokeDistrictPercentiles,
  revokeAllDistrictsPercentiles
};
