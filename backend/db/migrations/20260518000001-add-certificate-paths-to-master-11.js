'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if ph column exists, if not add it
    const tableDescription = await queryInterface.describeTable('master_11');
    
    if (!tableDescription.ph) {
      await queryInterface.addColumn('master_11', 'ph', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: '0: No, 1: Yes'
      });
    }
    
    await queryInterface.addColumn('master_11', 'birth_certificate_path', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    
    await queryInterface.addColumn('master_11', 'community_certificate_path', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    
    await queryInterface.addColumn('master_11', 'aadhar_card_path', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
    
    await queryInterface.addColumn('master_11', 'other_certificate_path', {
      type: Sequelize.STRING(500),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('master_11', 'ph');
    await queryInterface.removeColumn('master_11', 'birth_certificate_path');
    await queryInterface.removeColumn('master_11', 'community_certificate_path');
    await queryInterface.removeColumn('master_11', 'aadhar_card_path');
    await queryInterface.removeColumn('master_11', 'other_certificate_path');
  }
};
