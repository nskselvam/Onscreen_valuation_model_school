'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('neetMedium', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
      Test_Code: {
        type: Sequelize.STRING(25),
        allowNull: true
      },
      D_CODE: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      Medium: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      ImpDate: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('neetMedium');
  }
};
