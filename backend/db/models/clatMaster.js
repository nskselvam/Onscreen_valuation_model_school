'use strict';

module.exports = (sequelize, DataTypes) => {
  const clatMaster = sequelize.define(
    'clatMaster',
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      BATCHNAME: { type: DataTypes.STRING(2), allowNull: true },
      ROLLNO: { type: DataTypes.STRING(10), allowNull: true },
      Candidate_Name: { type: DataTypes.STRING(255), allowNull: true },
      Test_Code: { type: DataTypes.STRING(15), allowNull: true },
      IMG_SHEETNO: { type: DataTypes.STRING(50), allowNull: true },
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
      Total1_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Total2_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Total3_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Total4_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total1_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total2_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total3_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total4_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      CORANS: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'clatMaster',
      timestamps: true,
      indexes: [{ fields: ['ROLLNO'] }, { fields: ['Test_Code'] }, { fields: ['BATCHNAME'] }],
    }
  );

  return clatMaster;
};
