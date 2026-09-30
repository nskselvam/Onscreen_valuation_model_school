'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const chief_remarks = sequelize.define(
        "chief_remarks",
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
            feedback: {
                type: DataTypes.STRING(250),
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
            RemarksSubject: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            Insert_Date: {
                type: DataTypes.DATE,
                allowNull: true,
                defaultValue: DataTypes.NOW
            },
            Barcode: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            view_status: {
                type: DataTypes.STRING(5),
                allowNull: false,
                defaultValue: 'N'
            }
        },
        {
            tableName: "chief_remarks",
            timestamps: false
        }
    );

    return chief_remarks;
};
