'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const neetDescription = sequelize.define(
    'neetDescription',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      ex_code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: { args: [0, 15], msg: 'Exam code must not exceed 15 characters' }
        }
      },
      og_desc: {
        type: DataTypes.STRING(30),
        allowNull: true,
        validate: {
          len: { args: [0, 30], msg: 'Description must not exceed 30 characters' }
        }
      }
    },
    {
      tableName: 'neetDescription',
      timestamps: true,
      indexes: [
        { fields: ['ex_code'] }
      ]
    }
  );

  neetDescription.associate = function (models) {
    // define associations here if needed
  };

  return neetDescription;
};
