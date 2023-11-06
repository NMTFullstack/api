var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/duLieuXoaController")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const QLTS = require('../../services/QLTS/qltsService');

// dữ liệu xoá trang chủ
router.get('/dataDeleteHome',functions.checkToken,QLTS.checkRole('none',1),controller.dataDeleteHome)

// danh sách tài sản đã xoá
router.post('/dataTaiSanDeleted',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.dataTaiSanDeleted)

// danh sách tài sản cấp phát thu hồi đã xoá
router.post('/dataCapPhatThuHoiDeleted',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.dataCapPhatThuHoiDeleted)

// danh sách tài sản điều chuyển bàn giao đã xoá
router.post('/dataDieuChuyenBanGiaoDeleted',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.dataDieuChuyenBanGiaoDeleted)

// danh sách kiểm kê đã xoá
router.post('/dataKiemKeDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.dataKiemKeDaXoa)

// danh sách sửa chữa đã xoá
router.post('/taiSanSuaChuaDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.taiSanSuaChuaDaXoa)

// danh sách bảo dưỡng đã xoá
router.post('/baoDuongDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.baoDuongDaXoa)

// danh sách tài sản báo mất đã xoá
router.post('/taiSanBaomatDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.taiSanBaomatDaXoa)

// danh sách tài sản báo huỷ đã xoá
router.post('/taiSanBaoHuyDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.taiSanBaoHuyDaXoa)

// danh sách tài sản thanh lý đã xoá
router.post('/taiSanThanhLyDaXoa',functions.checkToken,QLTS.checkRole('none',1),formData.parse(),controller.taiSanThanhLyDaXoa)
module.exports = router