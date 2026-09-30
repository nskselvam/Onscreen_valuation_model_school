'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const generalAbilityData = sequelize.define(
    'generalAbilityData',
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
      TOTAL: { type: DataTypes.DOUBLE, allowNull: true },
      CORRECT: { type: DataTypes.DOUBLE, allowNull: true },
      WRONG: { type: DataTypes.DOUBLE, allowNull: true },
      BLANK: { type: DataTypes.DOUBLE, allowNull: true },
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
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Total_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Verbal_Ability_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Gk_Current_Affairs_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      Quants_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Total_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Verbal_Ability_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Gk_Current_Affairs_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      d_Quants_Percentile: { type: DataTypes.DOUBLE, allowNull: true },
      CORANS: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'generalAbilityData',
      timestamps: true,
      indexes: [
        {
          name: 'idx_general_ability_rollno',
          fields: ['ROLLNO']
        },
        {
          name: 'idx_general_ability_test_code',
          fields: ['Test_Code']
        },
        {
          name: 'idx_general_ability_batchname',
          fields: ['BATCHNAME']
        }
      ]
    }
  );

  generalAbilityData.associate = function (models) {
    // Define associations here if needed
    // Example:
    // generalAbilityData.belongsTo(models.test_master, {
    //   foreignKey: 'Test_Code',
    //   targetKey: 'test_code',
    //   as: 'testDetails'
    // });
  };

  return generalAbilityData;
};
