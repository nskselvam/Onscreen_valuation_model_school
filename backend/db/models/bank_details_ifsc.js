'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const bank_details_ifsc = sequelize.define(
    "bank_details_ifsc",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      BANK: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      IFSC: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      BRANCH: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      ADDRESS: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      CITY1: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      CITY2: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      STATE: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      STD_CODE: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      PHONE: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      freezeTableName: true,
      modelName: 'bank_details_ifsc',
      timestamps: true
    }
  );

  return bank_details_ifsc;
};
