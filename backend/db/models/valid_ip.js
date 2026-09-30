'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const valid_ips = sequelize.define(
    "valid_ips",
    {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    Ip_Address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    block_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vflg: {
      type: DataTypes.STRING,
      allowNull: true
    },
    campus: {
      type: DataTypes.STRING,
      allowNull: true
    },
    floor: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    freezeTableName: true,
    modelName: 'valid_ips',
    timestamps: true,
    indexes: [
      {
        unique: true,
        name:'Ip_Address',
        fields: ['Ip_Address']
      }
    ]
  });
  
  return valid_ips;
};