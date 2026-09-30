'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('master_11', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      district_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      block_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      edu_dist_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      udise_code: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      school_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      school_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      management: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      cate_type: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Emis_No: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Gender_Label: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      dob_emis: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      father_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      mother_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      class_studying_id: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Disability_status: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Disability_Name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      community_name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Medium: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Gdc_DOB: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Gdc_Gender: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Gdc_Medium: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      Cen_Code: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      com: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sex: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      pstm: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      dob: {
        type: Sequelize.DATE,
        allowNull: true
      },
      Student_Status: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Zone_Jee: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Zone_Neet: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      Zone_Name_Jee: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      Zone_Name_Neet: {
        type: Sequelize.STRING(50),
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
    await queryInterface.dropTable('master_11');
  }
};
