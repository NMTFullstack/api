const router = require('express').Router();
const functions = require('../../../services/functions')
const controller = require('../../../controllers/vanthu/QuanLyCongVan/dataDidDeleteController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')
// lấy dữ liệu 
router.post('/getDataDidDelete',functions.checkToken,formData.parse(),permissions.checkPermission('dele_vb',3),controller.getDataDidDelete)

// lấy chi tiết data đã xoá
router.post('/getDetailDataDelete',functions.checkToken,formData.parse(),permissions.checkPermission('dele_vb',3),controller.getDetailDataDelete)

// xoá vĩnh viễn
router.post('/deleteVV',functions.checkToken,formData.parse(),permissions.checkPermission('dele_vb',4),controller.deleteVV)

module.exports = router;