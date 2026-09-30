'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('user_details');

    const columnsToAdd = {
      token_version: { type: Sequelize.INTEGER, allowNull: true, defaultValue: 0 },
      User_Roll_Admin: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_0: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_1: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_2: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_3: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_4: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_5: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_6: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_7: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_8: { type: Sequelize.STRING(500), allowNull: true },
      User_Roll_Admin_9: { type: Sequelize.STRING(500), allowNull: true },
    };

    for (const [col, definition] of Object.entries(columnsToAdd)) {
      if (!tableDesc[col]) {
        await queryInterface.addColumn('user_details', col, definition);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    const cols = [
      'token_version', 'User_Roll_Admin',
      'User_Roll_Admin_0', 'User_Roll_Admin_1', 'User_Roll_Admin_2',
      'User_Roll_Admin_3', 'User_Roll_Admin_4', 'User_Roll_Admin_5',
      'User_Roll_Admin_6', 'User_Roll_Admin_7', 'User_Roll_Admin_8',
      'User_Roll_Admin_9',
    ];
    for (const col of cols) {
      await queryInterface.removeColumn('user_details', col);
    }
  }
};
