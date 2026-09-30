'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('imgmaster', 'Img_Path', {
      type: Sequelize.STRING(100),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('imgmaster', 'Img_Path', {
      type: Sequelize.STRING(20),
      allowNull: true
    });
  }
};
