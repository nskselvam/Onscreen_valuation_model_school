'use strict';

const tables = [
  'import1',
  ...Array.from({ length: 20 }, (_, index) => `val_data_${String(index + 1).padStart(2, '0')}`),
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of tables) {
        const columns = await queryInterface.describeTable(table, { transaction });
        if (!columns.testcode) {
          await queryInterface.addColumn(table, 'testcode', {
            type: Sequelize.STRING(50),
            allowNull: true,
          }, { transaction });
        }
      }

      for (const table of tables) {
        await queryInterface.sequelize.query(
          `UPDATE "${table}" AS target
           SET "testcode" = subject."testcode"
           FROM "sub_master" AS subject
           WHERE target."testcode" IS NULL
             AND target."subcode" = subject."Subcode"
             AND subject."testcode" IS NOT NULL`,
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of [...tables].reverse()) {
        const columns = await queryInterface.describeTable(table, { transaction });
        if (columns.testcode) {
          await queryInterface.removeColumn(table, 'testcode', { transaction });
        }
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
