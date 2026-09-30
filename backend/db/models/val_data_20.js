'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class val_data_20 extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  
  val_data_20.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    Dep_Name: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    sec_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    barcode: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    qbno: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    page_no: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    subcode: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    testcode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    },
    section: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    sub_section: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    add_sub_section: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    max_marks: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    Qbs_Page_No: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    eva_id: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    evid_ce: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    checkdate: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    img_mark1: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    cmt: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    Comment: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    Marks_Get: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    tick: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    img_mark: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Blank: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    RI: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    RI_cmt: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Irrelevant: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    IR_cmt: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    NotAnswered: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    vflg: {
      type: DataTypes.STRING(4),
      allowNull: true
    },
    updated_on: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    valid_qbs: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'N'
    },
    FLG: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'N'
    },
    Eva_Mon_Year: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Chief_Flg: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'N'
    },
    Chief_checkdate: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    BL_Point: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    CO_Point: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    PO_Point: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    valuation_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    Examiner_type: {
      type: DataTypes.STRING(20),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'val_data_20',
    tableName: 'val_data_20',
    timestamps: true,
        indexes: [
      {
        unique: true,
        fields: ['sec_id', 'barcode', 'qbno', 'subcode', 'section', 'eva_id', 'valuation_type', 'Examiner_type'],
        name: 'unique_val_data_20_combined'
      }
    ]
  });
  
  return val_data_20;
};
