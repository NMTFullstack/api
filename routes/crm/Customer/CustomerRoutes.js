const express = require('express');
const router = express.Router();
var formData = require('express-form-data');
const CustomerRoutes = require('../../../controllers/crm/Customer/Customer');
const functions = require("../../../services/functions");


//Api hiển thị và tìm kiếm 

router.post('/list', functions.checkToken, formData.parse(), CustomerRoutes.showKH)


// Api tìm kiếm trùng

router.post('/searchSame', functions.checkToken, formData.parse(), CustomerRoutes.searchSame)

//Api thêm mới khách hàng

router.post('/addCustomer', functions.checkToken, formData.parse(), CustomerRoutes.addCustomer);

//Api xoa khach hang

router.post('/deleteKH', functions.checkToken, formData.parse(), CustomerRoutes.DeleteKH)

//Api thêm mới kết nối Api
router.post("/addApiKH", functions.checkToken, formData.parse(), CustomerRoutes.addConnectCs)

//Api sửa kết nối Api
router.post('/editApi', functions.checkToken, formData.parse(), CustomerRoutes.editConnectCs)

//Api hiển thị Api
router.post('/showApi', functions.checkToken, formData.parse(), CustomerRoutes.ShowConnectCs)

// api kết nối từ các site về crm
router.post("/website/add", formData.parse(), CustomerRoutes.addFromWebsite);
router.post("/website/edit", formData.parse(), CustomerRoutes.editFromWebsite);

module.exports = router;