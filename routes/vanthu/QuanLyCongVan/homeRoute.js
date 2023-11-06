const router = require('express').Router();
const functions = require('../../../services/functions')
const homeController = require('../../../controllers/vanthu/QuanLyCongVan/homeController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')
// get data trang chủ site quản lý công văn
router.get('/index',functions.checkToken,permissions.checkPermission('none',1),homeController.index)

// get data select
router.get('/supportSelectOption',functions.checkToken,permissions.checkPermission('none',1),homeController.supportSelectOption)
module.exports = router;