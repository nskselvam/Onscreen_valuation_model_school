'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class sub_master extends Model {
    static associate(models) {
      // define association here
    }
  }
  
  sub_master.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    Subcode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    testcode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    SUBNAME: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    Dep_Name: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    Eva_Mon_Year: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    Rate_Per_Script: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Min_Amount: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    MARKS_FOR: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    cnt: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    Valcnt: {
      type: DataTypes.STRING(2),
      allowNull: false
    },
    Mark_Diff: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    diff_flg: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    Degree_Status: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    qb_flg: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'N'
    },
    ans_flg: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'N'
    },
    mismatch_flg: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'N'
    },
    Type_of_Exam: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    mismatch_remarks: {
      type: DataTypes.ARRAY(DataTypes.STRING(255)),
      allowNull: true,
      defaultValue: []
    },
    mcq_flg: {
      type: DataTypes.STRING(15),
      allowNull: false,
      defaultValue: 'N'
    },
    Eva_Id: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null,
    },
    mcq_qst: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 20,
    },
    mcq_updates: {
      type: DataTypes.STRING(2),
      allowNull: false,
      defaultValue: 'N'
    },
    no_Papers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, 
  {
    sequelize,
    modelName: 'sub_master',
    tableName: 'sub_master',
    timestamps: true,
    indexes: [
      {
        name: 'Subcode_Sub_idx',
        fields: ['Subcode']
      },
      {
        name: 'Dep_Name_Sub_idx',
        fields: ['Dep_Name']
      }
    ]
  });
  
  return sub_master;
};
