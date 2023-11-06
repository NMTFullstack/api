const router = require('express').Router();
const vanBanDiController = require("../../../controllers/vanthu/GuiNhanCongVan/vanBanDiController");
var formData = require('express-form-data');
const functions = require('../../../services/functions');

router.post('/createVanBanIn', functions.checkToken, formData.parse(), vanBanDiController.getDataAndCheck, vanBanDiController.createVanBanIn);
router.post('/createVanBanOut', functions.checkToken, formData.parse(), vanBanDiController.getDataAndCheck, vanBanDiController.createVanBanOut);
router.post('/getListVanBanDiDaGui', functions.checkToken, formData.parse(), vanBanDiController.getListVanBanDiDaGui);
router.post('/getDetailVanBan', functions.checkToken, formData.parse(), vanBanDiController.getDetailVanBan);

router.post('/createChuyenTiep', functions.checkToken, formData.parse(), vanBanDiController.createChuyenTiep);
router.post('/deleteVanBan', functions.checkToken, formData.parse(), vanBanDiController.deleteVanBan);
router.post('/checkLuuQLCV', functions.checkToken, formData.parse(), vanBanDiController.checkLuuQLCV);
router.post('/luuVBCTY', functions.checkToken, formData.parse(), vanBanDiController.luuVBCTY);
router.post('/setTrangThaiVanBan', functions.checkToken, formData.parse(), vanBanDiController.setTrangThaiVanBan);
router.post('/checkQuyenBanHanh', functions.checkToken, formData.parse(), vanBanDiController.checkQuyenBanHanh);
router.post('/getUserByEmail', functions.checkToken, formData.parse(), vanBanDiController.getUserByEmail);
router.post('/getUserByType', functions.checkToken, formData.parse(), vanBanDiController.getUserByType);
router.post('/getUserByOrganize', functions.checkToken, formData.parse(), vanBanDiController.getUserByOrganize);

module.exports = router