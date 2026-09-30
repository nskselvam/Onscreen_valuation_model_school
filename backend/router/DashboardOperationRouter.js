const router = require("express").Router();
const {
	getDashboardData,
	getModelSchoolAdministratorDashboard,
} = require("../controller/DashboardOperationController");
const { protect } = require("../middleware/authMiddleware");

router.get("/dashboard-data", getDashboardData);
router.get("/model-school-administrator", protect, getModelSchoolAdministratorDashboard);

module.exports = router;