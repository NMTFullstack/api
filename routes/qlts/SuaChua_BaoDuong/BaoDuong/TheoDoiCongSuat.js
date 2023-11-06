const router = require("express").Router();
const formData = require("express-form-data");
const functions = require('../../../../services/functions');
const fnc = require('../../../../services/QLTS/qltsService');
const controllers = require('../../../../controllers/qlts/SuaChua_BaoDuong/BaoDuong/TheoDoiCongSuat');

//don vi do cong suat 
router.post('/add_donvi_csuat', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.add_dvi_csuat);
router.post('/edit_donvi_csuat', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.edit_dvi_csuat);

// theo doi cong suat
router.post('/add_theodoi_csuat', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.add_do_csuat);
router.post('/update_theodoi_csuat', functions.checkToken, fnc.checkRole('SC_BD',2), formData.parse(), controllers.update_theodoi_cs);

router.post('/xoaTheoDoiCongSuat', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.xoaTheoDoiCongSuat);
router.post('/xoaDonViCongSuat', functions.checkToken, fnc.checkRole('SC_BD',3), formData.parse(), controllers.xoaDonViCongSuat);
router.post('/danhSachDonViCongSuat', functions.checkToken, fnc.checkRole('SC_BD'), formData.parse(), controllers.danhSachDonViCongSuat);

router.get('/excel/:_id', controllers.ExportExcel)

module.exports = router;