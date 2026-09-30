'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('humanitiesDescription', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      ex_code: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      og_desc: {
        type: Sequelize.STRING(130),
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

    // Add index for better query performance
    await queryInterface.addIndex('humanitiesDescription', ['ex_code'], {
      name: 'idx_humanities_description_ex_code'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('humanitiesDescription');
  }
};
