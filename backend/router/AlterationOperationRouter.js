const router = require("express").Router();
const { updateChiefExaminer,facultyData, updateExaminer } = require("../controller/AlterationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/faculty_data", protect, facultyData);
router.put("/update_examiner", protect, updateExaminer);
router.put("/update_chief_examiner", protect, updateChiefExaminer);

module.exports = router;