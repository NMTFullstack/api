const router = require('express').Router();
const controller = require('../../controllers/qlc/QRCode')
const formData = require('express-form-data')
const functions = require("../../services/functions")

router.post("/create", formData.parse(), functions.checkToken, controller.create)
router.post("/listAll", formData.parse(), functions.checkToken, controller.listAll)
router.post("/update", formData.parse(), functions.checkToken, controller.update)
router.post("/delete", formData.parse(), functions.checkToken, controller.delete)
router.post("/SettingTrackingQR", formData.parse(), functions.checkToken, controller.SettingTrackingQR)
router.post("/createUserTrackingQR", formData.parse(), functions.checkToken, controller.createUserTrackingQR)
router.post("/deleteUserTrackingQR", formData.parse(), functions.checkToken, controller.deleteUserTrackingQR)
router.post("/listSettingTrackingQR", formData.parse(), functions.checkToken, controller.listSettingTrackingQR)
router.post("/updateSettingTrackingQR", formData.parse(), functions.checkToken, controller.updateSettingTrackingQR)
router.post("/deleteSettingTrackingQR", formData.parse(), functions.checkToken, controller.deleteSettingTrackingQR)
router.post("/saveHisForApp", formData.parse(), functions.checkToken, controller.saveHisForApp)
module.exports = router