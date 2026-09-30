'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const generalAbilityDescription = sequelize.define(
    'generalAbilityDescription',
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
      tableName: 'generalAbilityDescription',
      timestamps: true,
      indexes: [
        {
          name: 'idx_general_ability_description_ex_code',
          fields: ['ex_code']
        }
      ]
    }
  );

  generalAbilityDescription.associate = function (models) {
    // Define associations here if needed
  };

  return generalAbilityDescription;
};
