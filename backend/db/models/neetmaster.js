'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const neetmaster = sequelize.define(
    'neetmaster',
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
      CORRECT1: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG1: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK1: { type: DataTypes.DOUBLE, allowNull: true },
      TOTAL1: { type: DataTypes.DOUBLE, allowNull: true },
      CORRECT2: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG2: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK2: { type: DataTypes.DOUBLE, allowNull: true },
      TOTAL2: { type: DataTypes.DOUBLE, allowNull: true },
      CORRECT3: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG3: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK3: { type: DataTypes.DOUBLE, allowNull: true },
      TOTAL3: { type: DataTypes.DOUBLE, allowNull: true },
      CORRECT4: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG4: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK4: { type: DataTypes.DOUBLE, allowNull: true },
      TOTAL4: { type: DataTypes.DOUBLE, allowNull: true },
      TOTAL: { type: DataTypes.DOUBLE, allowNull: true },
      CORRECT: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK: { type: DataTypes.DOUBLE, allowNull: true },
      ImpDate: { type: DataTypes.STRING(255), allowNull: true },
      Total_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Phy_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Che_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Bot_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Zoo_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Phy_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Che_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Bot_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Zoo_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      CORANS: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: { len: { args: [0, 255], msg: 'CORANS must not exceed 255 characters' } }
      }
    },
    {
      tableName: 'neetmaster',
      timestamps: true,
      indexes: [
        { fields: ['ROLLNO'] },
        { fields: ['Test_Code'] },
        { fields: ['BATCHNAME'] }
      ]
    }
  );

  neetmaster.associate = function (models) {
    // define associations here if needed
  };

  return neetmaster;
};
