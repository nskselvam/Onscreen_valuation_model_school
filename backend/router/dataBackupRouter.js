const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { listTables, downloadTable } = require('../controller/dataBackupController');

router.get('/tables',            protect, listTables);
router.get('/download/:tableName', protect, downloadTable);

module.exports = router;
