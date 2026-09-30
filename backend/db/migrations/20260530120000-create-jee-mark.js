'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jee_marks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      Phy_C: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Phy_W: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Phy_B: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Che_C: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Che_W: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Che_B: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Mat_C: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Mat_W: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Mat_B: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Phy_Tot: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      che_Tot: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Mat_Tot: {
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
      Phy_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Che_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      Mat_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Total_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Phy_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Che_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      d_Mat_Percentile: {
        type: Sequelize.DOUBLE,
        allowNull: true
      },
      CORANS: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jee_marks');
  }
};
