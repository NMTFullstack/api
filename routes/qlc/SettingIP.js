const router = require('express').Router();
const controller = require('../../controllers/qlc/SettingIP')
const formData = require('express-form-data')
const functions = require("../../services/functions")


router.post("/get", formData.parse(), functions.checkToken, controller.getListByID)

router.post("/listNew", formData.parse(), functions.checkToken, controller.getList)

router.post("/create", functions.checkToken, controller.createIP)

router.post("/createNew", functions.checkToken, formData.parse(), controller.create1IP)
router.post("/addIp", functions.checkToken, formData.parse(), controller.addIP)

router.post("/edit", formData.parse(), functions.checkToken, controller.editsettingIP)
router.post("/editNew", formData.parse(), functions.checkToken, controller.editsettingIPNew)
router.delete("/delete", formData.parse(), functions.checkToken, controller.deleteSetIpByID)
router.delete("/deleteNew", formData.parse(), functions.checkToken, controller.deleteSettingIPNew)

// cài đặt IP cá nhân
router.post("/getListPersonal", formData.parse(), functions.checkToken, controller.getListPersonalAccess)
router.post("/getDetailPersonal", formData.parse(), functions.checkToken, controller.getDetailPersonalIPAcc)
router.post("/createPersonal", formData.parse(), functions.checkToken, controller.createPersonalIPAcc)
router.post("/editPersonal", formData.parse(), functions.checkToken, controller.editPersonalSettingIP)
router.delete("/deletePersonal", formData.parse(), functions.checkToken, controller.deletePersonal)


module.exports = router