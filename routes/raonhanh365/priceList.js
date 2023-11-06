var express = require('express');
var router = express.Router();
var priceList = require('../../controllers/raonhanh365/priceList');
var formData = require('express-form-data');
const functions = require('../../services/functions');

//api lay ra danh sach bang gia hoac chi tiet cua mot bang gia
router.post('/getPriceList', formData.parse(), priceList.getPriceListRN);

router.get('/tool', formData.parse(), priceList.toolPriceList);

module.exports = router;