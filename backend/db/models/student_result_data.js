'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class student_result_data extends Model {
        static associate(models) {
            // define associations here
        }
    }

    student_result_data.init({
        sno: {
            type: DataTypes.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true
        },
        StudentID: {
            type: DataTypes.DOUBLE,
            allowNull: true,
            defaultValue: null
        },
        Studentsemester: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        SubjectID: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Subjectsemester: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Dummy_NO: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        RegisterNo: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        BundleNO: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Score: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        SubjectCode: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Grade: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        CourseID: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Exammonth: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        ExamYear: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        SubjectDescription: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Courseshortname: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Branch: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        EmployeeID: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        rscore: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        StudentMobileno: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        StudentOfficalEmailID: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        StudentContactNo: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        StudentPersonalEmailID: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Evaluator_Id: {
            type: DataTypes.STRING(25),
            allowNull: true,
            defaultValue: null
        },
        FACULTY_NAME: {
            type: DataTypes.STRING(150),
            allowNull: true,
            defaultValue: null
        },
        Mobile_Number: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Email_Id: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Eva_Mon_Year: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Dep_Name: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
        Import_Date: {
            type: DataTypes.STRING(25),
            allowNull: true,
            defaultValue: null
        },
        Valuation_Type: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0
        },
        reviewStatus: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: null
        },
        studentname: {
            type: DataTypes.STRING(255),
            allowNull: true,
            defaultValue: null
        },
    },
    {
        sequelize,
        modelName: 'student_result_data',
        tableName: 'student_result_data',
        timestamps: true,
        indexes: [
            { name: 'RegisterNo_idx', fields: ['RegisterNo'] },
            { name: 'SubjectCode_idx', fields: ['SubjectCode'] },
            { name: 'Dummy_NO_idx', fields: ['Dummy_NO'] },
            { name: 'Evaluator_Id_idx', fields: ['Evaluator_Id'] },
            { name: 'Eva_Mon_Year_idx', fields: ['Eva_Mon_Year'] }
        ]
    });

    return student_result_data;
};
