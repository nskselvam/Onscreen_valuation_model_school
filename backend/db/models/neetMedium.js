'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const neetMedium = sequelize.define(
    'neetMedium',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
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
      Test_Code: {
        type: DataTypes.STRING(25),
        allowNull: true,
        validate: {
          len: { args: [0, 25], msg: 'Test code must not exceed 25 characters' }
        }
      },
      D_CODE: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: { args: [0, 2], msg: 'District code must not exceed 2 characters' }
        }
      },
      Medium: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: { args: [0, 2], msg: 'Medium must not exceed 2 characters' }
        }
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'neetMedium',
      timestamps: true,
      indexes: [
        { fields: ['Test_Code'] },
        { fields: ['D_CODE'] },
        { fields: ['Medium'] }
      ]
    }
  );

  neetMedium.associate = function (models) {
    // define associations here if needed
  };

  return neetMedium;
};
