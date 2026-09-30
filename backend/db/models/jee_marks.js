'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Jee_Marks = sequelize.define(
    'Jee_Marks',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      BATCHNAME: {
        type: DataTypes.STRING(2),
        allowNull: true
      },
      ROLLNO: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Candidate_Name: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      TOTAL: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      CORRECT: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      WRONG: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      BLANK: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Phy_C: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Phy_W: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Phy_B: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Che_C: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Che_W: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Che_B: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Mat_C: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Mat_W: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Mat_B: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Phy_Tot: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      che_Tot: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Mat_Tot: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      ImpDate: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      Total_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Phy_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Che_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      Mat_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      d_Total_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      d_Phy_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      d_Che_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      d_Mat_Percentile: {
        type: DataTypes.FLOAT,
        allowNull: true
      },
      CORANS: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      tableName: 'jee_marks',
      timestamps: true,
      underscored: false
    }
  );

  return Jee_Marks;
};
