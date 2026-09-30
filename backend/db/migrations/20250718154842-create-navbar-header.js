'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Navbar_headers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      Nav_Main_Header_Name: {
        type: Sequelize.STRING
      },
      Nav_Main_Header_Name_Description: {
        type: Sequelize.STRING
      },
      Nav_Header_1: {
        type: Sequelize.INTEGER
      },
      Nav_Header_2: {
        type: Sequelize.INTEGER
      },
      Nav_Header_3: {
        type: Sequelize.INTEGER
      },
      user_Type: {
        type: Sequelize.INTEGER
      },
      user_Role: {
        type: Sequelize.INTEGER
      },
      Nav_Status: {
        type: Sequelize.INTEGER
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
    await queryInterface.dropTable('Navbar_headers');
  }
};