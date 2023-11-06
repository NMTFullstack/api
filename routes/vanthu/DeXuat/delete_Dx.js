const express = require('express');
const router = express.Router();
var formData = require('express-form-data');
const controller = require('../../../controllers/vanthu/DeXuat/delete_dx');
const functions = require('../../../services/functions')

//hàm khi người dùng ấn hủy tiếp nhận hoặc từ chối
router.post('/delete_dx',functions.checkToken,formData.parse(), controller.delete_dx);

// hàm hiển thị danh sách các đề xuất đã xóa
router.post('/ds_de_xuat_da_xoa',functions.checkToken,formData.parse(), controller.de_xuat_da_xoa_All);

module.exports = router;