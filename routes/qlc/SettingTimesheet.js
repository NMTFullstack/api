const router = require('express').Router();
const controller = require('../../controllers/qlc/SettingTimesheet')
const formData = require('express-form-data')
const functions = require("../../services/functions")


router.post("/add", formData.parse(), functions.checkToken, controller.addSetting)
router.post("/list", formData.parse(), functions.checkToken, controller.getSetting)
router.post("/del", formData.parse(), functions.checkToken, controller.delSetting)
router.post("/edit", formData.parse(), functions.checkToken, controller.editSetting)
module.exports = router