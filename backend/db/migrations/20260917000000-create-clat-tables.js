'use strict';

const sectionFields = {
  CORRECT1: { type: 'DOUBLE PRECISION', allowNull: true },
  WRONG1: { type: 'DOUBLE PRECISION', allowNull: true },
  BLANK1: { type: 'DOUBLE PRECISION', allowNull: true },
  TOTAL1: { type: 'DOUBLE PRECISION', allowNull: true },
  CORRECT2: { type: 'DOUBLE PRECISION', allowNull: true },
  WRONG2: { type: 'DOUBLE PRECISION', allowNull: true },
  BLANK2: { type: 'DOUBLE PRECISION', allowNull: true },
  TOTAL2: { type: 'DOUBLE PRECISION', allowNull: true },
  CORRECT3: { type: 'DOUBLE PRECISION', allowNull: true },
  WRONG3: { type: 'DOUBLE PRECISION', allowNull: true },
  BLANK3: { type: 'DOUBLE PRECISION', allowNull: true },
  TOTAL3: { type: 'DOUBLE PRECISION', allowNull: true },
  CORRECT4: { type: 'DOUBLE PRECISION', allowNull: true },
  WRONG4: { type: 'DOUBLE PRECISION', allowNull: true },
  BLANK4: { type: 'DOUBLE PRECISION', allowNull: true },
  TOTAL4: { type: 'DOUBLE PRECISION', allowNull: true },
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('clatMaster', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      BATCHNAME: { type: Sequelize.STRING(2), allowNull: true },
      ROLLNO: { type: Sequelize.STRING(10), allowNull: true },
      Candidate_Name: { type: Sequelize.STRING(255), allowNull: true },
      Test_Code: { type: Sequelize.STRING(15), allowNull: true },
      IMG_SHEETNO: { type: Sequelize.STRING(50), allowNull: true },
      ...Object.fromEntries(Object.keys(sectionFields).map((key) => [key, { type: Sequelize.DOUBLE, allowNull: true }])),
      TOTAL: { type: Sequelize.DOUBLE, allowNull: true },
      CORRECT: { type: Sequelize.DOUBLE, allowNull: true },
      WRONG: { type: Sequelize.DOUBLE, allowNull: true },
      BLANK: { type: Sequelize.DOUBLE, allowNull: true },
      ImpDate: { type: Sequelize.STRING(255), allowNull: true },
      Total_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      Total1_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      Total2_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      Total3_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      Total4_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      d_Total_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      d_Total1_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      d_Total2_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      d_Total3_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      d_Total4_Percentile: { type: Sequelize.DOUBLE, allowNull: true },
      CORANS: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('clatQuestion', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      BATCHNAME: { type: Sequelize.STRING(2), allowNull: true },
      Test_Code: { type: Sequelize.STRING(15), allowNull: true },
      Qno: { type: Sequelize.STRING(10), allowNull: true },
      Correct: { type: Sequelize.STRING(10), allowNull: true },
      Wrong: { type: Sequelize.STRING(10), allowNull: true },
      Blank: { type: Sequelize.STRING(10), allowNull: true },
      ImpDate: { type: Sequelize.STRING(255), allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('clatQuestion');
    await queryInterface.dropTable('clatMaster');
  },
};
