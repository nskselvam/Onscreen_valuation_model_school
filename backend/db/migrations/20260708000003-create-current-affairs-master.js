'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('currentAffairsMaster', {
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
      ROLLNO: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      Candidate_Name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Test_Code: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      CORRECT: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      WRONG: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      BLANK: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      TOTAL: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      ImpDate: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      CORANS: {
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
    await queryInterface.dropTable('currentAffairsMaster');
  }
};
