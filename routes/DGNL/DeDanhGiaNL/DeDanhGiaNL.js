const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/DeDanhGiaNL/DeDanhGiaNL');

var formData = require('express-form-data');
const functions = require('../../../services/functions')

router.post('/addDe',functions.checkToken,formData.parse(),controller.addDe)
router.get('/listDeDG',formData.parse(),controller.listDeDG)
router.get('/nameDeDG',formData.parse(),controller.listNameDe)
router.patch('/changeDeDG/:id', formData.parse(),controller.changeDeDG)
router.get('/desDeDG/:id',formData.parse(),controller.desDeDG)
router.put('/xoaDeDG',formData.parse(),controller.XoaDe)

module.exports = router