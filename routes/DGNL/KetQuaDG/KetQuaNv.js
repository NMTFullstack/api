const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/KetQuaDG/KetQuaNV');

var formData = require('express-form-data');

router.get('/allDep',controller.allDep)
router.get('/allKh',controller.allKh)
router.get('/allName',controller.allName)
router.post('/renderItem',formData.parse(),controller.renderItem)
router.post('/getKQ',formData.parse(),controller.getKQNV)
module.exports = router