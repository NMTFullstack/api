const express = require('express');
const router = express.Router();
const orders = require('../../controllers/timviec/orders');
const formData = require('express-form-data');
const functions = require('../../services/functions')

//Đặt hàng
router.post('/placeOrder', formData.parse(), orders.orderProduct);

router.get('/getPromoPoints', formData.parse(), functions.checkToken, orders.getPromotionalPoints);

router.post('/getDiscountData', formData.parse(), orders.getDiscountData);

router.post('/getPriceListByType', formData.parse(), orders.getPriceListByType)

router.post('/getPackageInfo', formData.parse(), orders.getPackageInfo)

router.post('/getOrderHistory', formData.parse(), orders.getOrderHistory);

router.post('/getOrderDetails', formData.parse(), orders.getOrderDetails);

router.post('/getPricelists', formData.parse(), orders.getPricelists);

router.post('/getVipData', formData.parse(), orders.getVipData);


module.exports = router;