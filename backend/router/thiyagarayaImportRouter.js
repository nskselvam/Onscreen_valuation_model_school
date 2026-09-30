const router = require("express").Router();
const { protect } = require("../middleware/authMiddleware");
const {
  thiyagarayaImportData,
  thiyagarayaImageCheck,
  thiyagarayaGetSubjectCode,
  thiyagarayaGetTableCount,
} = require("../controller/thiyagarayaImportController");

router.post("/", protect, thiyagarayaImportData);
router.get("/image-check", protect, thiyagarayaImageCheck);
router.get("/subject-code", protect, thiyagarayaGetSubjectCode);
router.get("/table-count", protect, thiyagarayaGetTableCount);

module.exports = router;
