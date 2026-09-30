const router = require("express").Router();
const {
  getDistrictMasterData,
  getVacancyData,
} = require("../controller/vacancyOperationController");
const { districtSendData } = require("../controller/masterOperatonController");
const { modalprotect } = require("../middleware/authMiddleware");

router.get("/get_district_master_data", modalprotect, getDistrictMasterData);
router.get("/get_vacancy_data/:dcode", modalprotect, getVacancyData);
router.post("/district_send_data", districtSendData);

module.exports = router;