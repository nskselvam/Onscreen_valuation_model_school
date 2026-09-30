'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const user_role_masters = sequelize.define(
    "user_role_masters",
    {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    user_role_code: {
      type: DataTypes.STRING(15),
      allowNull: true,
      validate: {
        len: {
          args: [0, 15],
          msg: 'User role code must not exceed 15 characters'
        }
      }
    },
    user_role: {
      type: DataTypes.STRING(30),
      allowNull: true,
      validate: {
        len: {
          args: [0, 30],
          msg: 'User role must not exceed 30 characters'
        }
      }
    }
  }, {
    freezeTableName: true,
    modelName: 'user_role_masters',
    timestamps: true
  });
  
  return user_role_masters;
};