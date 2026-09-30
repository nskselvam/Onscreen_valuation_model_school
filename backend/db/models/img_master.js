'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Img_Master = sequelize.define(
    'Img_Master',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      D_Code: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
          len: {
            args: [0, 2],
            msg: 'District code must not exceed 2 characters'
          }
        }
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: 'Test code must not exceed 15 characters'
          }
        }
      },
      Img_Path: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          len: {
            args: [0, 100],
            msg: 'Image path must not exceed 100 characters'
          }
        }
      }
    },
    {
      tableName: 'imgmaster',
      timestamps: true,
      underscored: false
    }
  );

  return Img_Master;
};
