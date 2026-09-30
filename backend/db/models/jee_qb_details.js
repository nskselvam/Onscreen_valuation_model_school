'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Jee_Qb_Details = sequelize.define(
    'Jee_Qb_Details',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      BATCHNAME: {
        type: DataTypes.STRING(2),
        allowNull: true
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Qno: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Correct: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Wrong: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Blank: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'jee_qb_details',
      timestamps: true,
      underscored: false
    }
  );

  return Jee_Qb_Details;
};
