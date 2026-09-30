'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const mcq_Answers_Master = sequelize.define(
        "mcq_Answers_Master",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            Qst_Number: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Qst_Ans: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            Qst_Remarks: {
                type: DataTypes.STRING(255),
                allowNull: true
            },
            Eva_Id: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Subcode: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            SubName: {
                type: DataTypes.STRING(100),
                allowNull: true
            },
            Dep_Name: {
                type: DataTypes.STRING(5),
                allowNull: true
            },
            Eva_Month: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Upload_Date: {
                type: DataTypes.STRING(50),
                allowNull: true
            },
            Updated_Flg: {
                type: DataTypes.STRING(1),
                allowNull: true
            }
        },
        {
            tableName: "mcq_Answers_Master",
            timestamps: true,
            indexes: [
                {
                    name: 'mcq_Answers_Master_Qst_Number',
                    fields: ['Qst_Number']
                },
                {
                    name: 'mcq_Answers_Master_Eva_Id',
                    fields: ['Eva_Id']
                },

            ]
        }
    );

    return mcq_Answers_Master;
};

