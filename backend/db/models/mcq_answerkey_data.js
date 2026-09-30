'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const mcq_answerkey_data = sequelize.define(
        "mcq_answerkey_data",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
                allowNull: false
            },
            ans_Mas: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            ans_Des: {
                type: DataTypes.STRING(50),
                allowNull: false
            }
        },
        {
            tableName: "mcq_answerkey_data",
            timestamps: false
        }
    );

    return mcq_answerkey_data;
};
