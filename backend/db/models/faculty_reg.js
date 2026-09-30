'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class faculty_reg extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  
  faculty_reg.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    Dep_Name: {
      type: DataTypes.STRING(15),
      allowNull: false
    },
    Eva_Id: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    FACULTY_NAME: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Password: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    Role: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    chief_examiner: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Eva_ctrl: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    LoginDate: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    InTime: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    OutTime: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    ResetPass: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    Checking: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    subcode: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reg_date: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vflg: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    FP: {
      type: DataTypes.BLOB('medium'),
      allowNull: true
    },
    mac: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    EvaFromDate: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    EvaToDate: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    Session_Cnt: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    insflg: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    FLG: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    Eva_Subject: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Eva_Mon_Year: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Max_Paper: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    Sub_Max_Paper: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Temp_Password: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    Mobile_Number: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    Sms_Status: {
      type: DataTypes.STRING(25),
      allowNull: true
    },
    Chief_Name: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    Email_Id: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    New_Flg: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    terms: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    Active_Status: {
      type: DataTypes.STRING(1),
      allowNull: true
    },
    Chief_subcode: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Chief_Eva_Subject: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Reviewer_examiner: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Reviewer_subcode: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Reviewer_Eva_Subject: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    disable_status: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    camp_offcer_id: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    Import_Date: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    camp_offcer_id_examiner: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Camp_id: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    camp_offcer_id_chief: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    Camp_id_chief: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    servername: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    Examiner_Valuation_Status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    Chief_Valuation_Status: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'faculty_reg',
    tableName: 'faculty_reg',
    timestamps: true,
    indexes: [
      { fields: ['Eva_Id'] }
    ]
  });
  
  return faculty_reg;
};
