'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('humanitiesQuestion', {
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

    // Add indexes for better query performance
    await queryInterface.addIndex('humanitiesQuestion', ['Test_Code'], {
      name: 'idx_humanities_question_test_code'
    });
    await queryInterface.addIndex('humanitiesQuestion', ['BATCHNAME'], {
      name: 'idx_humanities_question_batchname'
    });
    await queryInterface.addIndex('humanitiesQuestion', ['Qno'], {
      name: 'idx_humanities_question_qno'
    });
    await queryInterface.addIndex('humanitiesQuestion', ['Test_Code', 'Qno'], {
      name: 'idx_humanities_question_test_qno'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('humanitiesQuestion');
  }
};
