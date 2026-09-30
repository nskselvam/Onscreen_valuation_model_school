'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const quantitativeQuestion = sequelize.define(
    'quantitativeQuestion',
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
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: { args: [0, 15], msg: 'Test code must not exceed 15 characters' }
        }
      },
      Qno: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Question number must not exceed 10 characters' }
        }
      },
      Correct: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Correct must not exceed 10 characters' }
        }
      },
      Wrong: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Wrong must not exceed 10 characters' }
        }
      },
      Blank: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Blank must not exceed 10 characters' }
        }
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'quantitativeQuestion',
      timestamps: true,
      indexes: [
        {
          name: 'idx_quantitative_question_testcode',
          fields: ['Test_Code']
        },
        {
          name: 'idx_quantitative_question_batchname',
          fields: ['BATCHNAME']
        },
        {
          name: 'idx_quantitative_question_qno',
          fields: ['Qno']
        }
      ]
    }
  );

  quantitativeQuestion.associate = function(models) {
    // Define associations here if needed
    // Example: quantitativeQuestion.belongsTo(models.test_master, { foreignKey: 'Test_Code' });
  };

  return quantitativeQuestion;
};
