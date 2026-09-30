'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class HSE2_2017_RESULT_DATA_ANALYSIS extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  
  HSE2_2017_RESULT_DATA_ANALYSIS.init({
    REVDT: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null
    },
    REVNAME: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    DIST: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null
    },
    DISTNAME: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    SCHL: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    SCH_NAME: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    PER_REGNO: {
      type: DataTypes.DOUBLE,
      allowNull: true,
      defaultValue: null
    },
    NAME: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    SEX: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'HSE2_2017_RESULT_DATA_ANALYSIS',
    tableName: 'HSE2_2017_RESULT_DATA_ANALYSIS',
    timestamps: true
  });
  
  return HSE2_2017_RESULT_DATA_ANALYSIS;
};
