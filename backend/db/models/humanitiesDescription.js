'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const humanitiesDescription = sequelize.define(
    'humanitiesDescription',
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
        type: DataTypes.STRING(130),
        allowNull: true,
        validate: {
          len: { args: [0, 130], msg: 'Description must not exceed 130 characters' }
        }
      }
    },
    {
      tableName: 'humanitiesDescription',
      timestamps: true,
      indexes: [
        {
          name: 'idx_humanities_description_ex_code',
          fields: ['ex_code']
        }
      ]
    }
  );

  humanitiesDescription.associate = function (models) {
    // Define associations here if needed
  };

  return humanitiesDescription;
};
