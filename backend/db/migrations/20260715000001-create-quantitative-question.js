'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quantitativeQuestion', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      BATCHNAME: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      Test_Code: {
        type: Sequelize.STRING(15),
        allowNull: true
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
      ImpDate: {
        type: Sequelize.STRING(255),
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

    // Add indexes for frequently queried columns
    await queryInterface.addIndex('quantitativeQuestion', ['Test_Code'], {
      name: 'idx_quantitative_question_testcode'
    });
    await queryInterface.addIndex('quantitativeQuestion', ['BATCHNAME'], {
      name: 'idx_quantitative_question_batchname'
    });
    await queryInterface.addIndex('quantitativeQuestion', ['Qno'], {
      name: 'idx_quantitative_question_qno'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quantitativeQuestion');
  }
};
