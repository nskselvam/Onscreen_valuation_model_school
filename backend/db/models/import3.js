'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class import3 extends Model {
    static associate(models) {
      // define association here
    }
  }
  import3.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    batchname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    subcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Dep_Name: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    },
    barcode: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    dcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Evaluator_Id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chef_exam_chk: {
      type: DataTypes.STRING(250),
      allowNull: true,
      defaultValue: null
    },
    re_chk_ce: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null
    },
    reject_flg: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    Modify_flg: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    R_No: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null
    },
    R_No1: {
      type: DataTypes.BIGINT,
      allowNull: true,
      defaultValue: null
    },
    R_No_Date: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null
    },
    FLG: {
      type: DataTypes.STRING(3),
      allowNull: true,
      defaultValue: null
    },
    Checked: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    E_flg: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    A_date: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null
    },
    A_time: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    },
    ip: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null
    },
    total: {
      type: DataTypes.STRING(11),
      allowNull: true,
      defaultValue: null
    },
    tot_round: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    tot_ce: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    tot_round_ce: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    total2: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    PFLG: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    tflg: {
      type: DataTypes.STRING(4),
      allowNull: true,
      defaultValue: null
    },
    checkdate: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    },
    checkdate_ce: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    ImgCnt: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    ImpDate: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    },
    Implot: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    Eva_Mon_Year: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    Flname: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    Remarks: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null
    },
    Chief_Flg: {
      type: DataTypes.STRING(1),
      allowNull: false,
      defaultValue: 'N'
    },
    Chief_checkdate: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    },
    Chief_Evaluator_Id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chief_Checked: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    Chief_E_flg: {
      type: DataTypes.STRING(5),
      allowNull: true,
      defaultValue: null
    },
    Chief_A_date: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chief_A_time: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null
    },
    Chief_ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chief_total: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: null
    },
    Chief_tot_round: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null
    },
    Chief_Valuation_Evaluator_Id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chief_tflg: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Chief_checkdate_Valuation: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    camp_offcer_id_examiner: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    Camp_id: {
      type: DataTypes.STRING(25),
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'import3',
    tableName: 'import3',
    timestamps: true,
    indexes: [
      {
        name:'Dep_Name_import3',
        fields: ['Dep_Name']
      },
      {
        name :'Camp_id_import3',
        fields: ['Camp_id']
      },
      {
        name: 'subcode_import3',
        fields: ['subcode']
      },
      {
        name: 'R_No_import3',
        fields: ['R_No']
      },
      {
        name: 'Evaluator_Id_import3',
        fields: ['Evaluator_Id']
      }
    ]
  });
  return import3;
};
