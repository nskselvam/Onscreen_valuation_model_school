"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  const jee_fieldname = sequelize.define(
    "jee_fieldname",
    {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.INTEGER,
      },
      ex_code: {
        type: DataTypes.STRING(15),
        allowNull: true,
        validate: {
          len: {
            args: [0, 15],
            msg: "Exam code must not exceed 15 characters",
          },
        },
      },
      og_desc: {
        type: DataTypes.STRING(30),
        allowNull: true,
        validate: {
          len: {
            args: [0, 30],
            msg: "Original description must not exceed 30 characters",
          },
        },
      },
    },
    {
      tableName: "jee_fieldnames",
      timestamps: true,
      indexes: [
        {
          fields: ["ex_code"],
        },
      ],
    }
  );

  jee_fieldname.associate = function (models) {
    // Define associations here if needed
  };

  return jee_fieldname;
};
