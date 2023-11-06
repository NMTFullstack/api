const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/Dulieuxoaganday/TieuChiDeDG');
const functions = require('../../../services/functions')
var formData = require('express-form-data');


router.get('/NameTc', functions.checkToken, controller.getNameTc)
router.post('/TcXoa', functions.checkToken, formData.parse(), controller.getTcXoa)
router.post('/restoreTc', formData.parse(), controller.restoreTC)
router.post('/restoreTcs', formData.parse(), controller.restoreTCs)
router.delete('/deleteTc', formData.parse(), controller.deleteTC)
router.delete('/deleteTcs', formData.parse(), controller.deleteTcs)
router.post('/restoreDG', formData.parse(), controller.restoreDG)
router.post('/restoreDGs', formData.parse(), controller.restoreDGs)
router.delete('/deleteDG', formData.parse(), controller.deleteDG)
router.delete('/deleteDGs', formData.parse(), controller.deleteDGs)
router.post('/DeDGXoa', formData.parse(), controller.deDG)
router.get('/renderCount', functions.checkToken, controller.renderCount)

module.exports = router