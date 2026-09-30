"use strict";
const bcrypt = require("bcrypt");
const { Model } = require("sequelize");
const AppError = require("../../utils/appError");

module.exports = (sequelize, DataTypes) => {
  const User_Logs = sequelize.define(
    "User_Logs",
    {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    User_Name: {
      type: DataTypes.STRING,
      allowNull:false
    },
    User_Acticity: {
      type: DataTypes.STRING,
      allowNull:false
    },
    User_Ip: {
      type: DataTypes.STRING,
      allowNull:false
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
  },
  {
    freezeTableName: true,
    modelName: "User_Logs",
    
  });
  
  return User_Logs;
};