'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('master_data')) return;

    await queryInterface.createTable('master_data', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      D_Code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Degree_Name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Flg: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Time_Flg: {
        type: Sequelize.STRING,
        allowNull: true
      },
      Paper_Time: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('master_data', ['D_Code'], {
      unique: true,
      name: 'D_Code_Master'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('master_data');
  }
};