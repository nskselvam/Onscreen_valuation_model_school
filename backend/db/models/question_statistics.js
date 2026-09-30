'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Question_Statistics = sequelize.define(
    'Question_Statistics',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Qno: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Question number'
      },
      Correct: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Number of correct answers'
      },
      Wrong: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Number of wrong answers'
      },
      Blank: {
        type: DataTypes.STRING(10),
        allowNull: true,
        comment: 'Number of blank answers'
      },
      Test_Code: {
        type: DataTypes.STRING(25),
        allowNull: true,
        comment: 'Test code identifier'
      },
      D_CODE: {
        type: DataTypes.STRING(2),
        allowNull: true,
        comment: 'District code'
      },
      Medium: {
        type: DataTypes.STRING(2),
        allowNull: true,
        comment: 'Medium of exam (e.g., EN, TM)'
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Import date'
      }
    },
    {
      tableName: 'question_statistics',
      timestamps: true,
      underscored: false
    }
  );

  // Define associations here if needed
  // Question_Statistics.associate = (models) => {
  //   Question_Statistics.belongsTo(models.Test_Master, {
  //     foreignKey: 'Test_Code',
  //     targetKey: 'test_code'
  //   });
  //   Question_Statistics.belongsTo(models.District_Master, {
  //     foreignKey: 'D_CODE',
  //     targetKey: 'district_code'
  //   });
  // };

  return Question_Statistics;
};
