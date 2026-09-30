"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class valid_sections extends Model {
    static associate(models) {
      // define association here
    }
  }

  valid_sections.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sub_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      testcode: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      Dep_Name: {
        type: DataTypes.STRING(15),
        allowNull: false,
      },
      subcode_raw: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      qstn_num: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      max_mark: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      valid_qstn: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      section: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      sub_section: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      add_sub_section: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      Eva_Mon_Year: {
        type: DataTypes.STRING(10),
        allowNull: true,
      },
      BL_Point: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      CO_Point: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      PO_Point: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "valid_sections",
      tableName: "valid_sections",
      timestamps: true,
      indexes: [
        {
          name: "valid_sections_sub_section",
          fields: ["sub_section"],
        },
        {
          name: "valid_sections_sub_code",
          fields: ["sub_code"],
        },
        {
          name: "valid_sections_section",
          fields: ["section"],
        },
        {
          name: "valid_sections_qstn_num",
          fields: ["qstn_num"],
        },
        {
          name: "valid_sections_add_sub_section",
          fields: ["add_sub_section"],
        },
        {
          name: "Dep_Name_sections",
          fields: ["Dep_Name"],
        }
      ],
    }
  );

  return valid_sections;
};
