'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('master_11', 'candidate_option', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '0: Not Selected, 1: JEE, 2: NEET, 3: Both'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_11', 'candidate_option');
  }
};
