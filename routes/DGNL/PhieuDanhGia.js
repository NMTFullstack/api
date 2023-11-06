var express = require('express');
var router = express.Router();
const KhDanhGia = require('../../controllers/DanhGiaNangLuc/PhieuDanhGia/PhieuDanhGia');
const PhieuDanhGiaChiTiet = require('../../controllers/DanhGiaNangLuc/PhieuDanhGia/PhieuDanhGiaChiTiet');
const formData = require("express-form-data")
const functions = require('../../services/functions')


router.post('/getListBang', formData.parse(), functions.checkToken, KhDanhGia.getListBang);
router.post('/ListUsers', formData.parse(), functions.checkToken, KhDanhGia.ListUsers);
router.post('/allNguoiDanhGia', formData.parse(), functions.checkToken, KhDanhGia.allNguoiDanhGia);
router.put('/deleteKHDG', formData.parse(), functions.checkToken, KhDanhGia.deleteKHDG);

router.post('/getAllPhieuDanhGiaChiTiet', formData.parse(), functions.checkToken, PhieuDanhGiaChiTiet.getAllPhieuDanhGiaChiTiet);
router.post('/ListUsers', formData.parse(), functions.checkToken, PhieuDanhGiaChiTiet.ListUsers);
router.post('/PhieuDanhGia', formData.parse(), functions.checkToken, PhieuDanhGiaChiTiet.PhieuDanhGia);

module.exports = router;