'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const valuation_payment_detail = sequelize.define(
        "valuation_payment_detail",
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
            Chief_Descrption_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Chief_Descrption: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            No_Daya_Max_Pap: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Total: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: "valuation_payment_detail",
            timestamps: false
        }
    );

    return valuation_payment_detail;
};
