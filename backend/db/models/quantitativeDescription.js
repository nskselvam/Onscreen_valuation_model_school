'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const quantitativeDescription = sequelize.define(
    'quantitativeDescription',
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER
      },
      ex_code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: { args: [0, 15], msg: 'Exam code must not exceed 15 characters' }
        }
      },
      og_desc: {
        type: DataTypes.STRING(30),
        allowNull: true,
        validate: {
          len: { args: [0, 30], msg: 'Description must not exceed 30 characters' }
        }
      }
    },
    {
      tableName: 'quantitativeDescription',
      timestamps: true,
      indexes: [
        {
          name: 'idx_quantitative_description_excode',
          fields: ['ex_code']
        }
      ]
    }
  );

  quantitativeDescription.associate = function(models) {
    // Define associations here if needed
  };

  return quantitativeDescription;
};
