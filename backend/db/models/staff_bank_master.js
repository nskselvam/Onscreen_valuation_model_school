'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const staff_bank_master = sequelize.define(
    "staff_bank_master",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Slno: {
        type: DataTypes.DOUBLE,
        allowNull: true
      },
      EMPLOYEE_ID: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      EMPLOYEE_CODE: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      EMPLOYEE_NAME: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      DIVISION: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      DESIGNATION: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      GENDER: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      CONTACT_NUMBER: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      EMAIL: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      BANK_ACCOUNT_NUMBER: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      OFFICE_NAME: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      PAYROLL_PROCESSED_MONTH: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      IFSC: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      BANK_NAME: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      BRANCH: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      NATUREOFBANK: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      BANK_ADDRESS: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      freezeTableName: true,
      modelName: 'staff_bank_master',
      timestamps: true,
      indexes: [
        {
          name:'EMPLOYEE_ID_BANK_IDX',
          fields: ["EMPLOYEE_ID","IFSC"]
        }
      ]
    }
  );

  return staff_bank_master;
};
