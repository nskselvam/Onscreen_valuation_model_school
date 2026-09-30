const express = require("express");
const asyncHandler = require("express-async-handler");
const db = require("../db/models");
const { Sequelize } = require("sequelize");
const AppError = require("../utils/appError");

// Get all tables
const getTables = asyncHandler(async (req, res) => {
  try {
    // Test database connection first
    await db.sequelize.authenticate();
    
    // PostgreSQL query for getting all tables
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    
    const tables = await db.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });


    const tableNames = tables.map(t => t.table_name || t.TABLE_NAME);


    res.status(200).json({
      success: true,
      tables: tableNames,
      count: tableNames.length,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch tables",
      error: error.toString(),
    });
  }
});

// Execute SQL query
const executeQuery = asyncHandler(async (req, res) => {
  let { query } = req.body;

  if (!query || !query.trim()) {
    throw new AppError("Query is required", 400);
  }

  const trimmedQuery = query.trim().toUpperCase();

  // Convert MySQL commands to PostgreSQL equivalents
  if (trimmedQuery === 'SHOW TABLES;' || trimmedQuery === 'SHOW TABLES') {
    query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
  } else if (trimmedQuery.startsWith('SHOW DATABASES') || trimmedQuery.startsWith('SHOW SCHEMAS')) {
    query = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `;
  } else if (trimmedQuery.startsWith('DESCRIBE ') || trimmedQuery.startsWith('DESC ')) {
    // Extract table name from DESCRIBE or DESC command
    const tableName = query.trim().split(/\s+/)[1].replace(/;$/, '');
    query = `
      SELECT 
        column_name as "Field",
        data_type as "Type",
        is_nullable as "Null",
        column_default as "Default"
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = '${tableName}'
      ORDER BY ordinal_position;
    `;
  }

  // Security: Block dangerous operations (optional, can be customized)
  const dangerousKeywords = ['DROP DATABASE', 'DROP SCHEMA'];
  for (const keyword of dangerousKeywords) {
    if (trimmedQuery.includes(keyword)) {
      throw new AppError(`Operation not allowed: ${keyword}`, 403);
    }
  }

  try {
    // Determine query type
    const isSelect = trimmedQuery.startsWith('SELECT') || 
                     trimmedQuery.startsWith('SHOW') || 
                     trimmedQuery.startsWith('DESCRIBE') ||
                     trimmedQuery.startsWith('DESC');

    if (isSelect) {
      // For SELECT queries, return rows
      const results = await db.sequelize.query(query, {
        type: Sequelize.QueryTypes.SELECT,
      });

      res.status(200).json({
        success: true,
        rows: results,
        rowCount: results.length,
      });
    } else {
      // For INSERT, UPDATE, DELETE, CREATE, ALTER, etc.
      const [results, metadata] = await db.sequelize.query(query);

      let message = 'Query executed successfully';
      let affectedRows = 0;

      if (metadata) {
        affectedRows = metadata.affectedRows || metadata.rowCount || 0;
        
        if (trimmedQuery.startsWith('INSERT')) {
          message = `${affectedRows} row(s) inserted successfully`;
        } else if (trimmedQuery.startsWith('UPDATE')) {
          message = `${affectedRows} row(s) updated successfully`;
        } else if (trimmedQuery.startsWith('DELETE')) {
          message = `${affectedRows} row(s) deleted successfully`;
        } else if (trimmedQuery.startsWith('CREATE')) {
          message = 'Table/Database created successfully';
        } else if (trimmedQuery.startsWith('ALTER')) {
          message = 'Table altered successfully';
        } else if (trimmedQuery.startsWith('DROP')) {
          message = 'Table/Database dropped successfully';
        }
      }

      res.status(200).json({
        success: true,
        message,
        affectedRows,
        rows: [],
      });
    }
  } catch (error) {
    console.error("Query execution error:", error);
    
    // Send detailed error message
    res.status(400).json({
      success: false,
      message: error.message || "Query execution failed",
      error: error.original?.message || error.message,
    });
  }
});

// Get table structure
const getTableStructure = asyncHandler(async (req, res) => {
  const { tableName } = req.params;

  if (!tableName) {
    throw new AppError("Table name is required", 400);
  }

  try {
    const query = `DESCRIBE ${tableName};`;
    
    const structure = await db.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
      success: true,
      tableName,
      structure,
    });
  } catch (error) {
    console.error("Error fetching table structure:", error);
    throw new AppError(`Failed to fetch structure for table: ${tableName}`, 500);
  }
});

// Get table data with pagination
const getTableData = asyncHandler(async (req, res) => {
  const { tableName } = req.params;
  const { limit = 100, offset = 0 } = req.query;

  if (!tableName) {
    throw new AppError("Table name is required", 400);
  }

  try {
    const query = `SELECT * FROM ${tableName} LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};`;
    
    const data = await db.sequelize.query(query, {
      type: Sequelize.QueryTypes.SELECT,
    });

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${tableName};`;
    const [countResult] = await db.sequelize.query(countQuery, {
      type: Sequelize.QueryTypes.SELECT,
    });

    res.status(200).json({
      success: true,
      tableName,
      rows: data,
      rowCount: data.length,
      totalRows: countResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error("Error fetching table data:", error);
    throw new AppError(`Failed to fetch data for table: ${tableName}`, 500);
  }
});

module.exports = {
  getTables,
  executeQuery,
  getTableStructure,
  getTableData,
};
