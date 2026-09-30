'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const valuation_payment_master = sequelize.define(
        "valuation_payment_master",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            Report_I_Date: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Report_E_Data: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Evaluation_Id: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Evaluation_Name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            Camp_Id: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Camp_Officer_Id: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Camp_Officer_Name: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Examiner_Type: {
                type: DataTypes.STRING(1),
                allowNull: true
            },
            Subject_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Extra_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Chief_Day_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Chief_Max_Paper_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Total_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Additional_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            ChallanNumber: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },
            Da_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Da_Days: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Da_Per_Day_Amt: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Da_Descrption: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            Degree_Name: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            campusName: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            chief_Evaluated_Day: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            chief_Subcode_Evaluated_Script: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            chief_Examiner_Evaluated_Script: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            examiner_Subcode: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            examiner_Evaluator: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            subcode_Amt: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            examiner_Evaluator_Name: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            examinerstatus: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            travellingfrom: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            travellingto: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            department: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            institutionname: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
        },
        {
            tableName: "valuation_payment_master",
            timestamps: true,
            indexes: [
                {
                    name: "ChallanNumber_idx",
                    unique: true,
                    fields: ["ChallanNumber"],
                },
            ],
        }
    );

    valuation_payment_master.associate = (models) => {
        valuation_payment_master.hasMany(models.valuation_payment_subject, {
            foreignKey: 'Valuation_Payment_Master_Id',
            as: 'subjects'
        });
    };

    return valuation_payment_master;
};
