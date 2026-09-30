'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    const valuation_payment_subject = sequelize.define(
        "valuation_payment_subject",
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
            Subcode: {
                type: DataTypes.STRING(25),
                allowNull: true
            },
            Subname: {
                type: DataTypes.STRING(150),
                allowNull: true
            },
            No_Paper: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Paper_Amount: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            Total: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: "valuation_payment_subject",
            timestamps: true
        }
    );

    valuation_payment_subject.associate = (models) => {
        valuation_payment_subject.belongsTo(models.valuation_payment_master, {
            foreignKey: 'Valuation_Payment_Master_Id',
            as: 'master'
        });
    };

    return valuation_payment_subject;
};
