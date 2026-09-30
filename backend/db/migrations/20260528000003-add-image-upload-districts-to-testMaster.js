'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('testMaster', 'image_upload_districts', {
      type: Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null,
      comment: 'Comma-separated district codes for image upload status'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('testMaster', 'image_upload_districts');
  }
};
