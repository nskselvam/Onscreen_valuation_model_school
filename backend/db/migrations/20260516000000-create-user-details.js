'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_details', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      D_Code: {
        type: Sequelize.STRING(10),
        allowNull: true
      },
      User_Id: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      User_Name: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      Password: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      Role: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      LoginDate: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      ResetPass: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      Temp_Password: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      Mobile_Number: {
        type: Sequelize.STRING(25),
        allowNull: true
      },
      Email_Id: {
        type: Sequelize.STRING(250),
        allowNull: true
      },
      Block: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      state_coord_dcode: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      mailer: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      activestatus: {
        type: Sequelize.STRING(15),
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_details');
  }
};
