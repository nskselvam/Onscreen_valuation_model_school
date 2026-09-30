'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const Valuation_Payment_Details_DataAdd = sequelize.define(
        "Valuation_Payment_Details_DataAdd",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            Valuation_Payment_Master_Id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Allowance_Desc: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Add_Amt: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Da_Amt: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Total: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: "Valuation_Payment_Details_DataAdd",
            timestamps: false
        }
    );

    return Valuation_Payment_Details_DataAdd;
};
