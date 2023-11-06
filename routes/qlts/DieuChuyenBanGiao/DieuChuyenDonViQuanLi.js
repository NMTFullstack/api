const router = require('express').Router();
const formData = require('express-form-data');
const controllers = require('../../../controllers/qlts/dieu_chuyen_ban_giao/DieuChuyenDonViQuanLi');
const functions = require('../../../services/functions');
const fnc = require('../../../services/QLTS/qltsService')

router.get('/excelDCVT/:_id', controllers.excelDCVT)

router.get('/excelDTSD/:_id', controllers.excelDTSD)

router.get('/excelDVQL/:_id', controllers.excelDVQL)

router.post('/create', functions.checkToken,fnc.checkRole("DC_BG",2) , formData.parse(), controllers.create);

router.post('/edit', functions.checkToken,fnc.checkRole("DC_BG",2) , formData.parse(), controllers.edit);

router.post('/list', functions.checkToken, formData.parse(), controllers.list);

router.post('/XacNhanDC', functions.checkToken, formData.parse(),fnc.checkRole("DC_BG",4), controllers.XacNhanDC);

router.post('/refuserTransfer', functions.checkToken, formData.parse(),fnc.checkRole("DC_BG",4), controllers.refuserTransfer);

router.post('/deleteMany', functions.checkToken, formData.parse(),fnc.checkRole("DC_BG",3), controllers.deleteMany);


module.exports = router;