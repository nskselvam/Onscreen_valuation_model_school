"use strict";
const { Model } = require("sequelize");
const AppError = require("../../utils/appError");

module.exports = (sequelize, DataTypes) => {
  const navbar_header = sequelize.define(
    "navbar_header",
    {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER,
    },
    Nav_Main_Header_Name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Navigation main header name is required",
        },
        notEmpty: {
          msg: "Navigation main header name is required",
        },
        len: {
          args: [2, 100],
          msg: "Navigation main header name must be between 2 and 100 characters",
        },
      },
    },
    Nav_Main_Header_Name_Description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 1000],
          msg: "Description must not exceed 1000 characters",
        },
      },
    },
    Nav_Header_1: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "Nav Header 1 is required",
        },
        isInt: {
          msg: "Nav Header 1 must be an integer",
        },
        min: {
          args: [0],
          msg: "Nav Header 1 must be a positive number",
        },
      },
    },
    Nav_Header_2: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "Nav Header 2 is required",
        },
        isInt: {
          msg: "Nav Header 2 must be an integer",
        },
        min: {
          args: [0],
          msg: "Nav Header 2 must be a positive number",
        },
      },
    },
    Nav_Header_3: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "Nav Header 3 is required",
        },
        isInt: {
          msg: "Nav Header 3 must be an integer",
        },
        min: {
          args: [0],
          msg: "Nav Header 3 must be a positive number",
        },
      },
    },
    Nav_Header_4:{
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "Nav Header 4 is required",
        },
        isInt: {
          msg: "Nav Header 4 must be an integer",
        },
        min: {
          args: [0],
          msg: "Nav Header 4 must be a positive number",
        },
      },
    },
    user_Type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        notNull: {
          msg: "User type is required",
        },
        isInt: {
          msg: "User type must be an integer",
        },
        min: {
          args: [0],
          msg: "User type must be 0 or greater",
        },
      },
    },
    user_Role: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        notNull: {
          msg: "User role is required",
        },
        isInt: {
          msg: "User role must be an integer",
        },
        min: {
          args: [0],
          msg: "User role must be a positive number",
        },
      },
    },
    Nav_Status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        notNull: {
          msg: "Navigation status is required",
        },
        isInt: {
          msg: "Navigation status must be an integer",
        },
        isIn: {
          args: [[0, 1, 2]],
          msg: "Status must be 0 (disabled), 1 (active), or 2 (inactive)",
        },
      },
    },
    Nav_Icons: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "Description must not exceed 500 characters",
        },
      },
    },
    route_path: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [0, 200],
          msg: "Route path must not exceed 200 characters",
        },
      },
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    freezeTableName: true,
    modelName: "Navbar_headers",
    tableName: "Navbar_headers",
    timestamps: true,
      indexes: [
        {
          name:'Navbar_header_idx',
          fields: ['Nav_Header_1','Nav_Header_2','Nav_Header_3','Nav_Header_4']
        }
      ]
  }
);

  return navbar_header;
};
