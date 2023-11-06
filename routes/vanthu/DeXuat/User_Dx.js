const express = require('express');
const router = express.Router();
const formData = require('express-form-data');
const controller = require('../../../controllers/vanthu/DeXuat/user_deXuat');
const functions = require('../../../services/functions')

//hiển thị đề xuất tôi gửi đi 
router.post('/user_send_deXuat_All',functions.checkToken,formData.parse(),controller.deXuat_user_send);

///hiển thị đề xuất gửi đến tôi 
router.post('/deXuat_send_user',functions.checkToken,formData.parse(),controller.de_xuat_send_to_me);

// /hiển thị đề xuất đang theo dõi 
router.post('/deXuat_follow',functions.checkToken,formData.parse(), controller.de_xuat_theo_doi);

//hiển thị danh sách đề xuất của công ty
router.post('/admin_danh_sach_de_xuat',functions.checkToken,formData.parse(), controller.admin_danh_sach_de_xuat);

module.exports = router;