const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/Dulieuxoaganday/PhieuDG');
const functions = require('../../../services/functions')
var formData = require('express-form-data');

router.get('/PhieuName',functions.checkToken,controller.PhieuName)
router.post('/PhieuData',functions.checkToken,formData.parse(),controller.PhieuData)
router.post('/restorePhieu',formData.parse(),controller.restorePhieu)
router.post('/restorePhieus',formData.parse(),controller.restorePhieus)
router.delete('/deletePhieu',formData.parse(),controller.deletePhieu)
router.delete('/deletePhieus',formData.parse(),controller.deletePhieus)


module.exports = router