const router = require('express').Router();
const functions = require('../../../services/functions')
const vanThu = require('../../../services/vanthu')
const listVanBanController = require('../../../controllers/vanthu/QuanLyCongVan/listTextController')
var formData = require('express-form-data');
const permissions = require('../../../controllers/vanthu/QuanLyCongVan/settingController.js')

// lấy danh sách văn bản đến
router.post('/getListVanBan',functions.checkToken,permissions.checkPermission('list_vb',3),formData.parse(),listVanBanController.getListVanBan)

// thêm văn bản đến
router.post('/createIncomingText',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',1),listVanBanController.createIncomingText)

// sửa văn bản đến
router.put('/updateIncomingText',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',2),listVanBanController.updateIncomingText)

//chức năng xoá, khôi phục văn bản, active hợp đồng
router.post('/synthesisFunction',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',4),listVanBanController.synthesisFunction)

//chức năng xem chi tiết
router.post('/getDetail',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',3),listVanBanController.getDetail)

//tạo mới văn bản đi
router.post('/createSendText',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',1),listVanBanController.createSendText)

//sửa văn bản đi
router.put('/updateSendText',functions.checkToken,formData.parse(),permissions.checkPermission('list_vb',2),listVanBanController.updateSendText)

module.exports = router;