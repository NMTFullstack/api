var express = require('express');
var router = express.Router();
const PhanQuyen = require('../../controllers/DanhGiaNangLuc/PhanQuyen/PhanQuyen');
const PhanQuyenChiTiet = require('../../controllers/DanhGiaNangLuc/PhanQuyen/PhanQuyenChiTiet');
const formData = require('express-form-data');
const funtions = require('../../services/functions')

router.post('/AllUsers', formData.parse(), funtions.checkToken, PhanQuyen.AllUsers);
router.post('/AllPb', formData.parse(), funtions.checkToken, PhanQuyen.AllPb);
router.post('/Table', formData.parse(), funtions.checkToken, PhanQuyen.Table);

router.post('/PhanQuyenChiTiet', formData.parse(), funtions.checkToken, PhanQuyenChiTiet.PhanQuyenChiTiet)
router.post('/editPhanQuyen', formData.parse(), funtions.checkToken, PhanQuyenChiTiet.editPhanQuyen)

module.exports = router;