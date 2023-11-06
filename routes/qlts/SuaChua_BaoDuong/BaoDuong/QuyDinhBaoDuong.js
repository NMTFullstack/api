const router = require('express').Router();
const formData = require('express-form-data');
const controllers = require('../../../../controllers/qlts/SuaChua_BaoDuong/BaoDuong/QuyDinhBaoDuong');
const functions = require('../../../../services/functions');
const fnc = require('../../../../services/QLTS/qltsService');

//quy dinh bao duong 
router.post('/edit_qdinh_baoduong', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.EditRegulations);
router.post('/add_qdinh_baoduong', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.addRegulations);
router.post('/xoaQuyDinhBaoDuong', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.xoaQuyDinhBaoDuong);

module.exports = router;
