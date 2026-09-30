'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('master_11', 'remarks', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Remarks or notes about the student record'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('master_11', 'remarks');
  }
};
