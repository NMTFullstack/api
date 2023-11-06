const express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const functions = require('../../services/functions')
const orderRN = require('../../controllers/raonhanh365/order');

// đặt hàng
router.post('/order',formData.parse(),functions.checkToken,orderRN.order)

// đấu thầu
router.post('/bidding',formData.parse(),functions.checkToken,orderRN.bidding)

// quản lý đơn mua
router.post('/manageOrderBuy',formData.parse(),functions.checkToken,orderRN.manageOrderBuy)

// quản lý đơn bán
router.post('/manageOrderSell',formData.parse(),functions.checkToken,orderRN.manageOrderSell)

// trạng thái đơn hàng
router.post('/statusOrder',formData.parse(),functions.checkToken,orderRN.statusOrder)

// Huỷ đơn hàng
router.post('/cancelOrder',formData.parse(),functions.checkToken,orderRN.cancelOrder)

// chi tiết huỷ đơn hàng
router.post('/detailCancelOrder',formData.parse(),functions.checkToken,orderRN.detailCancelOrder)

// chi tiết đơn hàng
router.post('/detailOrder',formData.parse(),functions.checkToken,orderRN.detailOrder)
module.exports = router;