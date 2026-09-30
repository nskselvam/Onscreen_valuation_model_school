'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('testMaster', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      testcode: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      testdate: {
        type: Sequelize.STRING(25),
        allowNull: false
      },
      sessions: {
        type: Sequelize.STRING(15),
        allowNull: false
      },
      no_of_ques: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      type_of_exam: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      std: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      exam_desc: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      flg: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      checkflg: {
        type: Sequelize.STRING(15),
        allowNull: false,
        defaultValue: 'N'
      },
      Img_Upload: {
        type: Sequelize.STRING(1),
        allowNull: false,
        defaultValue: 'N'
      },
      Key_Upload: {
        type: Sequelize.STRING(1),
        allowNull: false,
        defaultValue: 'N'
      },
      percentile_gen: {
        type: Sequelize.STRING(1),
        allowNull: false,
        defaultValue: 'N'
      },
      Test_Name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      test_districts: {
        type: Sequelize.STRING(255),
        allowNull: false
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
    await queryInterface.dropTable('testMaster');
  }
};
