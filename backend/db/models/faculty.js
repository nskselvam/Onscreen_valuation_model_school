'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const faculties = sequelize.define(
    "faculties",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      Dep_Name: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Eva_Id: {
        type: DataTypes.STRING(25),
        allowNull: false
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
      sms_status: {
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
      },
      token_version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      Dep_Name_1: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_2: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_3: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_4: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_5: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_6: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_7: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_8: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_9: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Dep_Name_0: {
        type: DataTypes.STRING(15),
        allowNull: true
      },
      Camp_id_Camp:{
        type: DataTypes.STRING(500),
        allowNull: true
      },
      Remarks_Gen:{
        type: DataTypes.STRING(500),
        allowNull: true
      },
      User_Roll_Admin:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_1:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_2:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_3:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_4:{
        type: DataTypes.STRING(1000), 
        allowNull: true
      },
        User_Roll_Admin_5:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_6:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_7:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_8:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_9:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
        User_Roll_Admin_0:{
        type: DataTypes.STRING(1000),
        allowNull: true
      },
      Eamil_Status:{
        type: DataTypes.STRING(500),
        allowNull: true
      },
    }, {
    //sequelize,
    freezeTableName: true,
    modelName: 'faculties',
    //tableName: 'faculties',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['Eva_Id']
      }
    ]
      }
  );

  return faculties;
};