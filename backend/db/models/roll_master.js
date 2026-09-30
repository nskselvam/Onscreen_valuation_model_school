'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const roll_master = sequelize.define(
    "roll_master",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      rollName: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      rollDescrption: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      rollStatus: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "roll_masters",
      timestamps: true
    }
  );

  return roll_master;
};
