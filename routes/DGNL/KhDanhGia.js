const router = require("express").Router()
const controller = require("../../controllers/DanhGiaNangLuc/KhDanhGia/KhDanhGia")
const formData = require("express-form-data")
const functions = require('../../services/functions')

router.get("/searchKH", controller.searchKH);
router.put("/xoaKh", formData.parse(), controller.XoaKH)
router.get("/showKh",formData.parse(),controller.showTen)
router.put("/duyetKh",formData.parse(),controller.duyetKh)
router.put("/tuchoiKh",formData.parse(),controller.tuchoiKh)
router.post("/addKh",functions.checkToken, formData.parse(),controller.addKh)
router.put("/chinhsuaKh",formData.parse(),controller.chinhsuaKh)
router.post("/nhanVienKH",controller.nhanVienKH) /// sua 
router.get("/showAllPhongBan",functions.checkToken,controller.showAllPhongBan)
router.get("/showAllNv",functions.checkToken,controller.showAllNhanvien)


// validate
router.post("/validateThemmoi1",formData.parse(),controller.validateThemMoi1)
router.post("/validateThemmoi2",formData.parse(),controller.validateThemMoi2)
router.post("/validateThemmoi3",formData.parse(),controller.validateThemMoi3)

module.exports = router