const express = require("express");
const router = express.Router();
const {protect} = require("../middleware/authMiddleware");
const {
  getTables,
  executeQuery,
  getTableStructure,
  getTableData,
} = require("../controller/adminSqlController");
// const { protect } = require("../middleware/authMiddleware");

// Note: Authentication is currently disabled for development
// Uncomment the line below to enable authentication in production
// router.use(protect);

// Get all tables
router.get("/tables", protect, getTables);

// Execute SQL query
router.post("/execute-query", protect, executeQuery);

// Get table structure
router.get("/table/:tableName/structure", protect, getTableStructure);

// Get table data with pagination
router.get("/table/:tableName/data", protect, getTableData);

module.exports = router;
