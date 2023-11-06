const router = require("express").Router()
const controller = require("../../controllers/qlc/ListFaceAndAllowFace")
const formData = require("express-form-data")

const functions = require("../../services/functions")



// Lấy danh sách nhân viên cần cập nhật khuôn mặt
router.post("/list", functions.checkToken, formData.parse(), controller.getlist);
// Duyệt cập nhật khuôn mặt
router.post("/add", functions.checkToken, formData.parse(), controller.add);
// Gửi yêu cầu cập nhật khuôn mặt
router.post("/request", functions.checkToken, formData.parse(), controller.request);
// Cập nhật khuôn mặt
router.post("/update_ep_featured_recognition", functions.checkToken, formData.parse(), controller.update_ep_featured_recognition);

//reset all update face to 0
router.post("/resetUpdateFaceAll", functions.checkToken, formData.parse(), controller.reset_all_update_face);

module.exports = router