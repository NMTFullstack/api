// luồng tin tuyển dụng
var express = require('express');
var router = express.Router();
var formData = require('express-form-data');
const newTV365 = require('../../../controllers/timviec/admin/newTV365');
// Cập nhật chi tiết tin
router.post('/updateNewTv365', formData.parse(), newTV365.updateNewTv365);

// Ghim tin
router.post('/updateNewTv365Hot', formData.parse(), newTV365.updateNewTv365Hot);

// Xóa tin
router.post('/deleteNewTV365', formData.parse(), newTV365.deleteNewTV365);

// Làm mới tin
router.post('/refreshNew', formData.parse(), newTV365.refreshNew);

module.exports = router;