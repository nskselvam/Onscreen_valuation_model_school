'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const cuetQuestion = sequelize.define(
    'cuetQuestion',
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
          len: { args: [0, 10], msg: 'Correct value must not exceed 10 characters' }
        }
      },
      Wrong: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Wrong value must not exceed 10 characters' }
        }
      },
      Blank: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
          len: { args: [0, 10], msg: 'Blank value must not exceed 10 characters' }
        }
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'cuetQuestion',
      timestamps: true
    }
  );

  return cuetQuestion;
};
