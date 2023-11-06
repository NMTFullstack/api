var express = require('express');
var router = express.Router();
const LoTrinhThangTien = require('../../controllers/DanhGiaNangLuc/LoTrinhThangTien/LoTrinhThangTien');
const LoTrinhThangTienChiTiet = require('../../controllers/DanhGiaNangLuc/LoTrinhThangTien/LoTrinhThangTienChiTiet');
const formData = require("express-form-data")
const functions = require('../../services/functions')


router.post('/renderPhongBan', formData.parse(), functions.checkToken, LoTrinhThangTien.renderPhongBan);
router.post('/SearchResult', formData.parse(), functions.checkToken, LoTrinhThangTien.SearchResult);
router.post('/getListThanhVien', formData.parse(), functions.checkToken, LoTrinhThangTien.getListThanhVien);


router.post('/getListChucVuChiTiet', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.getListChucVuChiTiet);
router.post('/themchucvu', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.themchucvu)
router.post('/deleteChucVu', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.deleteChucVu);
router.put('/editViTriChucVu', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.editViTriChucVu);
router.post('/themYccv', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.themYccv);
router.put('/editYccv', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.editYccv);
router.post('/deleteYccv', formData.parse(), functions.checkToken, LoTrinhThangTienChiTiet.deleteYccv);

module.exports = router;