'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Type_Exam = sequelize.define(
    'Type_Exam',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      type_of_exam_code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: 'Type of exam code must not exceed 15 characters'
          }
        }
      },
      type_of_exam_desc: {
        type: DataTypes.STRING(30),
        allowNull: true,
        validate: {
          len: {
            args: [0, 30],
            msg: 'Type of exam description must not exceed 30 characters'
          }
        }
      }
    },
    {
      tableName: 'typeExam',
      timestamps: true,
      underscored: false
    }
  );

  return Type_Exam;
};
