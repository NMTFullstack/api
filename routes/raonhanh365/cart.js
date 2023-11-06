var express = require('express');
var router = express.Router();
var cart = require('../../controllers/raonhanh365/cart');
var formData = require('express-form-data');
const functions = require('../../services/functions');

//api lay ra danh sach tin trong gio hang theo userId
router.post('/getCart', formData.parse(), functions.checkToken, cart.getListCartByUserId);

//api them tin vao gio hang
router.post('/addCart', formData.parse(), functions.checkToken, cart.addCart);

//api xoa 1 cart by id hoac xoa tat ca
router.delete('/removeCart', formData.parse(),functions.checkToken, cart.removeCart);

// thay đổi số lượng trong giỏ hàng
router.post('/changeCart', formData.parse(),functions.checkToken, cart.changeCart)

// chọn sản phẩm trong giỏ hàng
router.post('/tickCart', formData.parse(),functions.checkToken, cart.tickCart)

// lấy sản phẩm đã chọn
router.post('/getTickCart', formData.parse(),functions.checkToken, cart.getTickCart)

// thêm địa chỉ nhận hàng
router.post('/updateAddressCart', formData.parse(),functions.checkToken, cart.updateAddressCart)

// xoá địa chỉ nhận hàng
router.post('/deleteAddress', formData.parse(),functions.checkToken, cart.deleteAddress)
module.exports = router;