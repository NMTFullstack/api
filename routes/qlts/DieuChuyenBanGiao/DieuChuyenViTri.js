const router = require('express').Router();
const formData = require('express-form-data');
const controllers = require('../../../controllers/qlts/dieu_chuyen_ban_giao/DieuChuyenViTri');
const functions = require('../../../services/functions');
const fnc = require('../../../services/QLTS/qltsService');



router.post('/addDieuChuyenViTri', functions.checkToken, fnc.checkRole('DC_BG',2), formData.parse(), controllers.addDieuchuyenTaiSan);

router.post('/editDieuChuyenViTri', functions.checkToken, fnc.checkRole('DC_BG',2), formData.parse(), controllers.editDCTS);
router.post('/deleteDieuChuyenViTri', functions.checkToken, fnc.checkRole('DC_BG',3), formData.parse(), controllers.deleteBBDieuChuyen);
router.post('/detailsDCVT', functions.checkToken, fnc.checkRole('DC_BG',1), formData.parse(), controllers.detailsDCVTTS);
router.post('/TuChoiDCVT', functions.checkToken, fnc.checkRole('DC_BG',4), formData.parse(), controllers.TuchoiDCVT);
router.post('/TiepNhanDCVT', functions.checkToken, formData.parse(), controllers.TiepNhanDCVT);
router.post('/list_dieuChuyen_vitri', functions.checkToken, fnc.checkRole('DC_BG',1), formData.parse(), controllers.listBB);
router.post('/listAndDetail', functions.checkToken, fnc.checkRole('DC_BG',1), formData.parse(), controllers.listAndDetail);
module.exports = router;