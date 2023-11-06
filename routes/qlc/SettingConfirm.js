const router = require('express').Router();
const controller = require('../../controllers/qlc/SettingConfirm')
const formData = require('express-form-data')
const functions = require("../../services/functions")

// --------------- Cài đặt cấp độ duyệt cho nhân viên


// router.post("/settingUsers", formData.parse(), functions.checkToken, controller.settingUsers)
router.post("/updateAllSettingConfirmLevel", formData.parse(), functions.checkToken, controller.updateAllSettingConfirmLevel)



// -------------------- Cài đặt hình thức duyệt cho nhân viên


router.post("/updateAllSettingConfirmType", formData.parse(), functions.checkToken, controller.updateAllSettingConfirmType)
router.post("/listUser", formData.parse(), functions.checkToken, controller.listUser)
// cài đặt riêng
router.post("/updatePrivateLevel", formData.parse(), functions.checkToken, controller.updatePrivateLevel)
router.post("/updatePrivateType", formData.parse(), functions.checkToken, controller.updatePrivateType)
router.post("/updatePrivateTime", formData.parse(), functions.checkToken, controller.updatePrivateTime)

// chung
router.post("/listSettingPropose", formData.parse(), functions.checkToken, controller.listSettingPropose)
// thêm danh sách với công ty cũ
router.post("/settingProposeDefault", formData.parse(), functions.checkToken, controller.settingProposeDefault)
// cài đặt đề xuất
router.post("/settingPropose", formData.parse(), functions.checkToken, controller.settingPropose)

// chi tiết
router.post("/detailUser", formData.parse(), functions.checkToken, controller.detailUser)


module.exports = router