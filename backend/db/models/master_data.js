'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const master_data = sequelize.define(
    "master_data",
    {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    D_Code: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Degree_Name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Flg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Time_Flg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    Paper_Time: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    freezeTableName: true,
    modelName: 'master_data',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name: 'D_Code_Master',
        fields: ['D_Code']
      }
    ]
  });
  
  return master_data;
};