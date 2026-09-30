const router = require("express").Router();
const { getRegulationData, getCenterData, getDistrictData, getDistrictsByCodes } = require("../controller/GeneralGetSqlOperationController");
router.route("/regulation-data").get(getRegulationData);
router.route("/center-data").get(getCenterData);
router.route("/district-data").get(getDistrictData);
router.route("/district-data-by-codes").get(getDistrictsByCodes);
module.exports = router;