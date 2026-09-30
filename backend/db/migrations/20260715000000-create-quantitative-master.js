'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('quantitativeMaster', {
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
      IMG_SHEETNO: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      TOTAL: {
        type: Sequelize.DOUBLE,
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
    await queryInterface.addIndex('quantitativeMaster', ['ROLLNO'], {
      name: 'idx_quantitative_rollno'
    });
    await queryInterface.addIndex('quantitativeMaster', ['Test_Code'], {
      name: 'idx_quantitative_testcode'
    });
    await queryInterface.addIndex('quantitativeMaster', ['BATCHNAME'], {
      name: 'idx_quantitative_batchname'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('quantitativeMaster');
  }
};
