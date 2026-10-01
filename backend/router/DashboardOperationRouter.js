const router = require("express").Router();
const {
	getDashboardData,
	getModelSchoolAdministratorDashboard,
	getModelSchoolUploadInventory,
	getModelSchoolStudentMarks,
} = require("../controller/DashboardOperationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard-data", getDashboardData);
router.get("/model-school-administrator", protect, getModelSchoolAdministratorDashboard);
router.get("/model-school-administrator/uploads", protect, getModelSchoolUploadInventory);
router.get("/model-school-administrator/student-marks", protect, getModelSchoolStudentMarks);

module.exports = router;