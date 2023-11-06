const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/Dulieuxoaganday/KehoachDG');
const functions = require('../../../services/functions')
var formData = require('express-form-data');

router.post('/KhName',functions.checkToken,controller.KhName)
router.post('/KhData',functions.checkToken,formData.parse(),controller.DataKh)
router.post('/restoreKH',functions.checkToken ,formData.parse(),controller.restoreKH)
router.post('/restoreKHs',functions.checkToken ,formData.parse(),controller.restoreKHs)
router.delete('/deleteKH',functions.checkToken ,formData.parse(),controller.deleteKH)
router.delete('/deleteKHs',functions.checkToken ,formData.parse(),controller.deleteKHs)


module.exports = router