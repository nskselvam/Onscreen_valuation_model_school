'use strict';

module.exports = (sequelize, DataTypes) => {
  const spoken_english_qb_details = sequelize.define(
    'spoken_english_qb_details',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Qno: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Correct: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Wrong: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Blank: {
        type: DataTypes.STRING(10),
        allowNull: true
      },
      Test_Code: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      D_CODE: {
        type: DataTypes.STRING(10),
        allowNull: true
      }
    },
    {
      tableName: 'spoken_english_qb_details',
      timestamps: true,
      underscored: false
    }
  );

  return spoken_english_qb_details;
};
