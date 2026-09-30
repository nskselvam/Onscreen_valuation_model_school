require('dotenv').config({ path: `${process.cwd()}/.env` });
const sequelize = require('../config/database');

async function checkAndCreateTable() {
  try {
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' AND table_name='imgmaster'
    `);

    if (results.length > 0) {
      console.log('✓ imgmaster table already exists');
    } else {
      console.log('✗ imgmaster table does not exist, creating...');
      
      // Create table
      await sequelize.query(`
        CREATE TABLE imgmaster (
          id SERIAL PRIMARY KEY,
          "D_Code" VARCHAR(2),
          "Test_Code" VARCHAR(15),
          "Img_Path" VARCHAR(20),
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✓ imgmaster table created successfully');
    }
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkAndCreateTable();
