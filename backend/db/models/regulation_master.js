'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Regulation_Master = sequelize.define(
    'Regulation_Master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Regulation: {
        type: DataTypes.STRING(25),
        allowNull: true,
        validate: {
          len: {
            args: [0, 25],
            msg: 'Regulation must not exceed 25 characters'
          }
        }
      },
      regulationDesc: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Regulation description must not exceed 100 characters'
          }
        }
      }
    },
    {
      tableName: 'Regulation_Masters',
      timestamps: true,
      underscored: false
    }
  );

  return Regulation_Master;
};
