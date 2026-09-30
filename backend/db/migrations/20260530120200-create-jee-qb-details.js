'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jee_qb_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      BATCHNAME: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      Test_Code: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      Qno: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      Correct: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      Wrong: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      Blank: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      ImpDate: {
        type: Sequelize.STRING(255),
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
    await queryInterface.dropTable('jee_qb_details');
  }
};
