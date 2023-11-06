const router = require('express').Router();
const functions = require('../../../services/functions')
const historyUpdateController = require('../../../controllers/vanthu/QuanLyCongVan/historyUpdateController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')

// lấy danh sách văn bản đến
router.post('/getDataHistory',functions.checkToken,formData.parse(),permissions.checkPermission('lsu_vb',3),historyUpdateController.getDataHistory)

// lấy chi tiết văn bản đến
router.post('/getDetailHistoryUpdate',functions.checkToken,formData.parse(),permissions.checkPermission('lsu_vb',3),historyUpdateController.getDetailHistoryUpdate)
module.exports = router;