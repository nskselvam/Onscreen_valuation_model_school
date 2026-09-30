'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Jee_Fieldnames = sequelize.define(
    'Jee_Fieldnames',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ex_code: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      og_desc: {
        type: DataTypes.STRING(30),
        allowNull: true
      }
    },
    {
      tableName: 'jee_fieldnames',
      timestamps: true,
      underscored: false
    }
  );

  return Jee_Fieldnames;
};
