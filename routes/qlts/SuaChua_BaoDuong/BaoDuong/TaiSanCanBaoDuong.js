const router = require('express').Router();
const formData = require('express-form-data');
const controllers = require('../../../../controllers/qlts/SuaChua_BaoDuong/BaoDuong/TaiSanCanBaoDuong');
const functions = require('../../../../services/functions');
const fnc = require('../../../../services/QLTS/qltsService');

router.get('/excel/:id/:_id', controllers.ExportExcel)
router.get('/ExcelQuiDinh/:_id', controllers.ExcelQuiDinh)
router.get('/ExcelCongSuat/:_id', controllers.ExcelCongSuat)

//ts can bao duong 
router.post('/add_ts_can_bao_duong', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.add_Ts_can_bao_duong);
router.post('/updateBaoDuong', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.updateBaoDuong);
router.post('/tu_choi_ts_can_bao_duong', functions.checkToken, fnc.checkRole('SC_BD'), formData.parse(), controllers.TuChoiBaoDuong);
router.post('/delete1', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.delete1);
router.post('/deleteAll', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.deleteAll);

//lay ra danh sach cho ca 5 tap
router.post('/danhSachBaoDuong', functions.checkToken, fnc.checkRole('SC_BD'), formData.parse(), controllers.danhSachBaoDuong);
router.post('/hoanThanh', functions.checkToken, fnc.checkRole('SC_BD'), formData.parse(), controllers.hoanThanh);
router.post('/deleteBd', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.xoaBaoDuong);

module.exports = router;