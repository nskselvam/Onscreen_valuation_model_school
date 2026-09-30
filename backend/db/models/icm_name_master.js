'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Icm_Name_master = sequelize.define(
    'Icm_Name_master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      DCODE: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'DCODE must not exceed 255 characters'
          }
        }
      },
      DNAME: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'DNAME must not exceed 255 characters'
          }
        }
      },
      dist_Name: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          len: {
            args: [0, 255],
            msg: 'District name must not exceed 255 characters'
          }
        }
      }
    },
    {
      tableName: 'Icm_Name_masters',
      timestamps: true,
      underscored: false
    }
  );

  return Icm_Name_master;
};
