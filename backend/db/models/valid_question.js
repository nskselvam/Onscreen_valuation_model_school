'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class valid_question extends Model {
    static associate(models) {
      // define association here
    }
  }
  valid_question.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    SUBCODE: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    testcode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Dep_Name: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    SUBCODE_RAW: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null
    },
    SECTION: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    FROM_QST: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    TO_QST: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    MARK_MAX: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    NOQST: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    SUB_SEC: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    Eva_Mon_Year: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    C_QST: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'valid_question',
    tableName: 'valid_questions',
    timestamps: true,
    indexes: [
      {
        name: 'SUBCODE_VALID_QUESTIONS',
        unique: false,
        fields: ['SUBCODE']
      },
      {
        name: 'SECTION_SUBCODE',
        unique: false,
        fields: ['SECTION']
      },
      {
        name: 'SECTION_IDS',
        unique: false,
        fields: ['SECTION']
      },
      {
        name: 'FROM_QST_SUBCODE',
        unique: false,
        fields: ['FROM_QST']
      },
      {
        name :'Dep_Name_VALID',
        unique: false,
        fields: ['Dep_Name']
      }
    ]
  });
  return valid_question;
};
