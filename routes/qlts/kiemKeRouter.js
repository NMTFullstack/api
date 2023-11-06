var express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const kiemKeController = require('../../controllers/qlts/kiemKeController');
const functions = require('../../services/functions');

router.post('/create', formData.parse(), [kiemKeController.getAndCheckData, kiemKeController.create]);

router.post('/update', formData.parse(), [kiemKeController.getAndCheckData, kiemKeController.update]);

router.post('/danhSachKiemKe', formData.parse(), kiemKeController.danhSachKiemKe);

router.post('/delete', formData.parse(), kiemKeController.delete);

router.post('/deleteMany', formData.parse(), kiemKeController.deleteMany);

router.post('/duyet', formData.parse(), kiemKeController.duyet);

router.post('/chitiet', formData.parse(), kiemKeController.chiTiet);

router.post('/danhSachNgayKiemKe', formData.parse(), kiemKeController.danhSachNgayKiemKe);

module.exports = router;