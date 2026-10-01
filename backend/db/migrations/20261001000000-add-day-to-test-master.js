'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const columns = await queryInterface.describeTable('testMaster');
    if (!columns.day) {
      await queryInterface.addColumn('testMaster', 'day', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const columns = await queryInterface.describeTable('testMaster');
    if (columns.day) {
      await queryInterface.removeColumn('testMaster', 'day');
    }
  },
};
