'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('generalAbilityData', {
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
      ImpDate: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Verbal_Ability_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Gk_Current_Affairs_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Quants_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Verbal_Ability_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Gk_Current_Affairs_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Quants_Percentile: {
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
    await queryInterface.addIndex('generalAbilityData', ['ROLLNO'], {
      name: 'idx_general_ability_rollno'
    });
    await queryInterface.addIndex('generalAbilityData', ['Test_Code'], {
      name: 'idx_general_ability_test_code'
    });
    await queryInterface.addIndex('generalAbilityData', ['BATCHNAME'], {
      name: 'idx_general_ability_batchname'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('generalAbilityData');
  }
};
