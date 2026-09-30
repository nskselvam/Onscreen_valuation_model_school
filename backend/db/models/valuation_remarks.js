'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const valuation_remarks = sequelize.define(
        "valuation_remarks",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            evaluator_id: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            evaluator_name: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Remarks_Type: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            Examiner_Type: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            msg: {
                type: DataTypes.STRING(250),
                allowNull: true
            },
            evaluator_subject: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Dummy_Number: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            RemarksSubject: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            Campofficerid: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            Campid: {
                type: DataTypes.STRING(25),
                allowNull: false
            },
            Dep_Name: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            remarks_reasons: {
                type: DataTypes.STRING(255),
                allowNull: false
            }
        },
        {
            tableName: "valuation_remarks",
            timestamps: true
        }
    );

    return valuation_remarks;
};
