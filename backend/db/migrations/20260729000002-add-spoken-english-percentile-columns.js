'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('spokenEnglisMaster', 'Total_Percentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'd_Total_Percentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'listeningPerecentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'speakingPerecentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'readingPercentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'writingPercetile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'd_listeningPerecentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'd_speakingPerecentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'd_readingPercentile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });

    await queryInterface.addColumn('spokenEnglisMaster', 'd_writingPercetile', {
      type: Sequelize.DOUBLE,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('spokenEnglisMaster', 'd_writingPercetile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'd_readingPercentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'd_speakingPerecentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'd_listeningPerecentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'writingPercetile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'readingPercentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'speakingPerecentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'listeningPerecentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'd_Total_Percentile');
    await queryInterface.removeColumn('spokenEnglisMaster', 'Total_Percentile');
  },
};
