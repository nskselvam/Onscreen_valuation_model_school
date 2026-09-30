'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const currentAffairsDescription = sequelize.define(
    'currentAffairsDescription',
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
      tableName: 'currentAffairsDescription',
      timestamps: true,
      indexes: [
        { fields: ['ex_code'] }
      ]
    }
  );

  currentAffairsDescription.associate = function (models) {
    // define associations here if needed
  };

  return currentAffairsDescription;
};
