'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const District_Master = sequelize.define(
    'District_Master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      DCODE: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: 'District code must not exceed 15 characters'
          }
        }
      },
      DNAME: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'District name must not exceed 100 characters'
          }
        }
      }
    },
    {
      tableName: 'District_Masters',
      timestamps: true,
      underscored: false
    }
  );

  return District_Master;
};
