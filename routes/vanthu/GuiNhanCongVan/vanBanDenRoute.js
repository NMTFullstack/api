const router = require('express').Router();
const vanBanDenController = require("../../../controllers/vanthu/GuiNhanCongVan/vanBanDenController");
var formData = require('express-form-data');
const functions = require('../../../services/functions');

router.post('/getListVanBanMoi', functions.checkToken, formData.parse(), vanBanDenController.getListVanBanMoi);
router.post('/getListVanBanDaXuLy', functions.checkToken, formData.parse(), vanBanDenController.getListVanBanDaXuLy);
router.post('/getListVanBanCanDuyet', functions.checkToken, formData.parse(), vanBanDenController.getListVanBanCanDuyet);
router.post('/getListVanBanThuHoi', functions.checkToken, formData.parse(), vanBanDenController.getListVanBanThuHoi);
router.post('/getListVanBanCapNhat', functions.checkToken, formData.parse(), vanBanDenController.getListVanBanCapNhat);

router.post('/sendFeedback', functions.checkToken, formData.parse(), vanBanDenController.sendFeedback);
router.post('/sendLeader', functions.checkToken, formData.parse(), vanBanDenController.sendLeader);

module.exports = router