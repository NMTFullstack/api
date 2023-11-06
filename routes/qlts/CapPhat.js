var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/CapPhat")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const fnc = require('../../services/QLTS/qltsService')

router.get('/excelNV/:_id', controller.ExportExcelNV)
router.get('/excelPB/:_id', controller.ExportExcelPB)

router.post('/create',functions.checkToken,fnc.checkRole("CP_TH",2) ,formData.parse(),controller.create)

router.post('/edit',functions.checkToken, fnc.checkRole("CP_TH",2) ,formData.parse(),controller.edit)

router.post('/delete',functions.checkToken,fnc.checkRole("CP_TH",3) ,formData.parse(),controller.delete)

router.post('/deleteMany',functions.checkToken,fnc.checkRole("CP_TH",3) ,formData.parse(),controller.deleteMany)

router.post('/getListNV',functions.checkToken,fnc.checkRole("CP_TH",1) ,formData.parse(),controller.getListNV)

router.post('/getListDep',functions.checkToken,fnc.checkRole("CP_TH",1) ,formData.parse(),controller.getListDep)
//xác nhận bàn giao cấp phát
router.post('/updateStatus',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.updateStatus)
//đồng ý cấp phát
router.post('/acceptAllocation',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.acceptAllocation)

router.post('/DetailEmp',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.DetailEmp)

router.post('/getListDetail',functions.checkToken ,formData.parse(),controller.getListDetail)

router.post('/DetailDep',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.DetailDep)

router.post('/refuserAll',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.refuserAll)

router.post('/refuser2',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.refuser2)

router.post('/accept',functions.checkToken,fnc.checkRole("CP_TH") ,formData.parse(),controller.accept)
module.exports = router