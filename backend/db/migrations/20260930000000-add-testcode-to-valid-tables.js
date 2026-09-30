'use strict';

const tables = ['valid_questions', 'valid_sections'];

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

      await queryInterface.sequelize.query(
        `UPDATE valid_questions AS target
         SET testcode = subject.testcode
         FROM sub_master AS subject
         WHERE target.testcode IS DISTINCT FROM subject.testcode
           AND target."SUBCODE" = subject."Subcode"
           AND subject.testcode IS NOT NULL`,
        { transaction },
      );
      await queryInterface.sequelize.query(
        `UPDATE valid_sections AS target
         SET testcode = subject.testcode
         FROM sub_master AS subject
         WHERE target.testcode IS DISTINCT FROM subject.testcode
           AND target.sub_code = subject."Subcode"
           AND subject.testcode IS NOT NULL`,
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      for (const table of tables) {
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
