const router = require('express').Router();
const functions = require("../../services/functions")
const Applications = require("../../controllers/qlc/SettingIPApp")
var formData = require('express-form-data')

//
router.post("/listUser", formData.parse(), functions.checkToken, Applications.listUser)
router.post("/listAllApp", formData.parse(), functions.checkToken, Applications.getlistAllApp)
router.post("/setting", formData.parse(), functions.checkToken, Applications.setting)
router.post("/listApp", formData.parse(), functions.checkToken, Applications.getlistApp)
// router.post("/getlistAppCountMember", formData.parse(), functions.checkToken, Applications.getlistAppCountMember)
// router.post("/delete", formData.parse(), functions.checkToken, Applications.delete)

module.exports = router