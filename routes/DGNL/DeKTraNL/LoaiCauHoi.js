const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/DeKTraNL/LoaiCauHoi');

var formData = require('express-form-data');
const functions = require('../../../services/functions')

router.post('/listTypeQues',functions.checkToken,formData.parse(),controller.listTypeQues)
router.get('/searchTypeQues',controller.searchLoai)
router.put('/deleteQues',controller.deleteItem )
router.post('/addItem',formData.parse(),controller.addItem)
router.patch('/changeItem',formData.parse(),controller.changeItem)
module.exports = router