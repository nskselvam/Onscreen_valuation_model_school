'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const month_year_master = sequelize.define(
    "month_year_master",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Eva_Month: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Eva_Year: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Eva_Month_Des: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Eva_Year_Desc: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Month_Year_Status: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: 'Y'
      }
    },
    {
      tableName: "month_year_masters",
      timestamps: true
    }
  );

  return month_year_master;
};
