var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/ThuHoi")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const fnc = require('../../services/QLTS/qltsService')

router.post('/create',functions.checkToken,fnc.checkRole("CP_TH",2) ,formData.parse(),controller.create)

router.post('/edit',functions.checkToken,fnc.checkRole("CP_TH",2) ,formData.parse(),controller.edit)

router.post('/delete',functions.checkToken,fnc.checkRole("CP_TH",3) ,formData.parse(),controller.delete)

router.post('/deleteMany',functions.checkToken,fnc.checkRole("CP_TH",3) ,formData.parse(),controller.deleteMany)

router.post('/updateStatus',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.updateStatus)

router.post('/acceptRecallCapital',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.acceptRecallCapital)

router.post('/getListDetail',functions.checkToken,formData.parse(),controller.getListDetail)

router.post('/acceptHandOver',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.acceptHandOver)

router.post('/refuserHandOver',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.refuserHandOver)

router.post('/refuserRecall',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.refuserRecall)

router.post('/refuserRecallCapital',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.refuserRecallCapital)

router.post('/accept',functions.checkToken,fnc.checkRole("CP_TH",4) ,formData.parse(),controller.accept)


module.exports = router