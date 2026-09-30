'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vacancy_Masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Vac_Status: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Catgegory: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Vacancy: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      sex: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      pstm: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Student_Status: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Com: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      ph: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      seq: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      REM: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      REM1: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      REM2: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      REM3: {
        type: Sequelize.STRING(35),
        allowNull: true
      },
      Vacancy_Type: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Center_Type: {
        type: Sequelize.STRING(25),
        allowNull: true
      },
      Zone_Code: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Zone_Name: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      student_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      dCode: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      vacancyStd: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Vacancy_Masters');
  }
};
