const router = require('express').Router();
const functions = require('../../../services/functions')
const controller = require('../../../controllers/vanthu/QuanLyCongVan/settingController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')
// lấy danh sách quyền người dùng
 router.post('/getdecentralization',functions.checkToken,formData.parse(),permissions.checkPermission('thongke_vb',3),controller.getdecentralization)

// phân quyền người dùng 
router.post('/decentralization',functions.checkToken,formData.parse(),permissions.checkPermission('thongke_vb',2),controller.decentralization)

module.exports = router;