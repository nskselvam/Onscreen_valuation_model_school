'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add S3 key columns to store S3 object keys for easier file deletion
    await queryInterface.addColumn('master_11', 'birth_certificate_key', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'S3 object key for birth certificate'
    });

    await queryInterface.addColumn('master_11', 'community_certificate_key', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'S3 object key for community certificate'
    });

    await queryInterface.addColumn('master_11', 'aadhar_card_key', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'S3 object key for aadhar card'
    });

    await queryInterface.addColumn('master_11', 'other_certificate_key', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'S3 object key for other certificate'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove S3 key columns
    await queryInterface.removeColumn('master_11', 'birth_certificate_key');
    await queryInterface.removeColumn('master_11', 'community_certificate_key');
    await queryInterface.removeColumn('master_11', 'aadhar_card_key');
    await queryInterface.removeColumn('master_11', 'other_certificate_key');
  }
};
