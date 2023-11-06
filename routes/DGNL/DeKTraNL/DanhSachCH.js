const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/DeKTraNL/DanhSachCauHoi');

var formData = require('express-form-data');
const functions = require('../../../services/functions')
const Storage = require('../../../controllers/DanhGiaNangLuc/Storage')

router.post('/showQues',functions.checkToken,formData.parse(),controller.listQues)
router.post('/searchQues',controller.searchCH)
router.post('/addQues',functions.checkToken,formData.parse(),controller.addQues)
router.get('/detailQues/:id',controller.detailQues)
router.post('/updateQues',formData.parse(),controller.changeQues)
router.get('/deleteQues',formData.parse(),controller.deleteQues)
router.post('/uploadMultiple',Storage.any('files'),formData.parse(),controller.uploadMutiple)

module.exports = router