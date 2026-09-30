'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const campus_master = sequelize.define(
    "campus_master",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      campus_Code: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      campus_Name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      campus_mas_code: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "campus_masters",
      timestamps: true
    }
  );

  return campus_master;
};
