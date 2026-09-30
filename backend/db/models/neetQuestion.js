'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const neetQuestion = sequelize.define(
    'neetQuestion',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      BATCHNAME: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: { args: [0, 2], msg: 'Batch name must not exceed 2 characters' }
        }
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
      tableName: 'neetQuestion',
      timestamps: true,
      indexes: [
        { fields: ['Test_Code'] },
        { fields: ['BATCHNAME'] },
        { fields: ['Qno'] }
      ]
    }
  );

  neetQuestion.associate = function (models) {
    // define associations here if needed
  };

  return neetQuestion;
};
