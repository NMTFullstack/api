const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/Dulieuxoaganday/DeKt');
const functions = require('../../../services/functions')
var formData = require('express-form-data');

router.post('/DeKtName',functions.checkToken,formData.parse(),controller.DeKtName)
router.post('/DeKtData',functions.checkToken,formData.parse(),controller.DeKtData)
router.post('/restoreDeKt',formData.parse(),controller.restoreDeKt)
router.post('/restoreDeKts',formData.parse(),controller.restoreDeKts)
router.delete('/deleteDeKt',formData.parse(),controller.deleteDeKt)
router.delete('/deleteDeKts',formData.parse(),controller.deleteDeKts)

module.exports = router