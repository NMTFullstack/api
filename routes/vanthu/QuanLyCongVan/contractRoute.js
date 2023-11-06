const router = require('express').Router();
const functions = require('../../../services/functions')
const contractController = require('../../../controllers/vanthu/QuanLyCongVan/contractController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')
// get data trang chủ site quản lý công văn
router.post('/getListContract',functions.checkToken,formData.parse(),permissions.checkPermission('list_hd',3),contractController.getListContract)

// thêm hợp đồng đến
router.post('/createSendContract',functions.checkToken,formData.parse(),permissions.checkPermission('list_hd',1),contractController.createSendContract)

// sửa hợp đồng đến
router.put('/updateSendContract',functions.checkToken,formData.parse(),permissions.checkPermission('list_hd',2),contractController.updateSendContract)

// thêm hợp đồng đi
router.post('/createContract',functions.checkToken,formData.parse(),permissions.checkPermission('list_hd',1),contractController.createContract)

// sửa hợp đồng đi
router.put('/updateContract',functions.checkToken,formData.parse(),permissions.checkPermission('list_hd',2),contractController.updateContract)
module.exports = router;