const express = require('express');
const router = express.Router();
const priceList = require('../../controllers/timviec/priceList');
const formData = require('express-form-data');

// danh mục bảng giá
router.post('/getPriceList', priceList.getPriceList);

// chi tiết gói dich vụ
router.post('/viewDetail', formData.parse(), priceList.viewDetail);
module.exports = router;