var express = require('express');
var router = express.Router();
var formData = require('express-form-data');
const functions = require('../../services/functions');
const controller = require('../../controllers/timviec/account');

// Lấy danh sách tài khoản để đăng nhập
router.post('/getAccPermission', formData.parse(), controller.getAccPermission);

// Xóa video
router.post('/deleteVideo', functions.checkToken, formData.parse(), controller.deleteVideo);
module.exports = router;