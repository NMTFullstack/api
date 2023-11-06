const router = require('express').Router();
const controller = require('../../controllers/qlc/SettingOrganize')
const formData = require('express-form-data')
const functions = require("../../services/functions")


router.post("/create", formData.parse(), functions.checkToken, controller.create)
router.post("/listAll", formData.parse(), controller.listAll)
router.post("/list", formData.parse(), functions.checkToken, controller.list)
router.post("/update", formData.parse(), functions.checkToken, controller.update)
router.post("/delete", formData.parse(), functions.checkToken, controller.delete)
router.post("/listAllChoose", formData.parse(), functions.checkToken, controller.listAllChoose)
router.post("/swap", formData.parse(), functions.checkToken, controller.swap)

module.exports = router