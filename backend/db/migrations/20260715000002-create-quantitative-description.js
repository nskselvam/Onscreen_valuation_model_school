'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quantitativeDescription', {
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
        type: Sequelize.STRING(30),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add index for exam code
    await queryInterface.addIndex('quantitativeDescription', ['ex_code'], {
      name: 'idx_quantitative_description_excode'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quantitativeDescription');
  }
};
