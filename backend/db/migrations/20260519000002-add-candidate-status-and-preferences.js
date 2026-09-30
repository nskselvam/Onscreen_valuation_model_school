'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('master_11', 'candidate_status', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: '1=Present, 2=Not Eligible, 3=Not Willing, 4=Absent'
    });

    await queryInterface.addColumn('master_11', 'candidate_preferences', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Comma-separated preference codes: e.g., "1,2,3"'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_11', 'candidate_status');
    await queryInterface.removeColumn('master_11', 'candidate_preferences');
  }
};
