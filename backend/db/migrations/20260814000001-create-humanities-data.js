'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('humanities_data', {
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
      CORRECT1: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      WRONG1: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      BLANK1: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      TOTAL1: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      CORRECT2: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      WRONG2: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      BLANK2: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      TOTAL2: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      CORRECT3: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      WRONG3: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      BLANK3: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      TOTAL3: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      CORRECT4: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      WRONG4: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      BLANK4: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      TOTAL4: {
        type: Sequelize.DOUBLE,
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
      History_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Geography_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Economics_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Political_Science_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_History_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Geography_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Economics_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Political_Science_Percentile: {
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

    // Add indexes for better query performance
    await queryInterface.addIndex('humanities_data', ['ROLLNO'], {
      name: 'idx_humanities_rollno'
    });
    await queryInterface.addIndex('humanities_data', ['Test_Code'], {
      name: 'idx_humanities_test_code'
    });
    await queryInterface.addIndex('humanities_data', ['BATCHNAME'], {
      name: 'idx_humanities_batchname'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('humanities_data');
  }
};
