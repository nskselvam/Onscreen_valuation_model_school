'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const quantitativeMaster = sequelize.define(
    'quantitativeMaster',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      BATCHNAME: {
        type: DataTypes.STRING(2),
        allowNull: true
      },
      ROLLNO: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Roll number must not exceed 10 characters' }
        }
      },
      Candidate_Name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: { args: [0, 255], msg: 'Candidate name must not exceed 255 characters' }
        }
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: { args: [0, 15], msg: 'Test code must not exceed 15 characters' }
        }
      },
      IMG_SHEETNO: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      TOTAL: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      CORRECT: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      WRONG: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      BLANK: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      CORRECT1: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      WRONG1: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      BLANK1: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      TOTAL1: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      CORRECT2: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      WRONG2: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      BLANK2: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      TOTAL2: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      CORRECT3: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      WRONG3: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      BLANK3: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      TOTAL3: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Total_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      d_Total_Percentile: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      // Section percentiles: overall and district
      quantsPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      logicalReasoningPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      currentAffairsPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_quantsPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_logicalReasoningPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_currentAffairsPercentile: { type: DataTypes.DOUBLE, allowNull: true },
      CORANS: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Correct answers'
      }
    },
    {
      tableName: 'quantitativeMaster',
      timestamps: true,
      indexes: [
        {
          name: 'idx_quantitative_rollno',
          fields: ['ROLLNO']
        },
        {
          name: 'idx_quantitative_testcode',
          fields: ['Test_Code']
        },
        {
          name: 'idx_quantitative_batchname',
          fields: ['BATCHNAME']
        }
      ]
    }
  );

  quantitativeMaster.associate = function(models) {
    // Define associations here if needed
    // Example: quantitativeMaster.belongsTo(models.test_master, { foreignKey: 'Test_Code' });
  };

  return quantitativeMaster;
};
