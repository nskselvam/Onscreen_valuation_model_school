'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const datta_allowance = sequelize.define(
    "datta_allowance",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      depcode: {
        type: DataTypes.STRING(5),
        allowNull: true
      },
      particulars: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      remuneration_data: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      incidental: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      accomodation_cost: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      billprovide: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      dearnessallowance: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      travelallowance: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      particulars_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      remuneration_name: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: "datta_allowances",
      timestamps: true
    }
  );

  return datta_allowance;
};
