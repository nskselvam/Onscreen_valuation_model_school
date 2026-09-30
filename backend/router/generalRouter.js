const express = require("express");
const router = express.Router();
const { genDataUpdate,facultsplitUpdate,chieffacultsplitUpdate } = require("../controller/generalDataupdateController");
router.get('/gendataUpdate', genDataUpdate);
router.get('/facultsplitUpdate',facultsplitUpdate)
router.get('/chieffacultsplitUpdate',chieffacultsplitUpdate)

module.exports = router;