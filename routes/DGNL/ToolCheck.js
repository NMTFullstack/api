const router = require("express").Router()
const controller = require("../../controllers/DanhGiaNangLuc/CheckQuyen")
const formData = require("express-form-data")
const functions = require('../../services/functions')

router.get("/CheckQuyenLayout",functions.checkToken, controller.CheckQuyen);
router.get("/CaiDat",functions.checkToken, controller.CaiDat)
router.get("/DeDG",functions.checkToken, controller.DeDG)
router.get("/DeKT",functions.checkToken, controller.DeKT)
router.get("/KeHoach",functions.checkToken, controller.KeHoach)
router.get("/KetQuaDG",functions.checkToken, controller.KetQuaDG)
router.get("/LoTrinh",functions.checkToken, controller.LoTrinh)
router.get("/PhieuDanhGia",functions.checkToken, controller.PhieudDanhGia)
router.get("/",functions.checkToken, controller.LoTrinh)
module.exports = router