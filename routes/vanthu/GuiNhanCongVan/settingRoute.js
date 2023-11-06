const router = require('express').Router();
const settingController = require("../../../controllers/vanthu/GuiNhanCongVan/settingController");
var formData = require('express-form-data');
const functions = require('../../../services/functions');

router.post('/thietLapQuyen', functions.checkToken, settingController.thietLapQuyen);
router.post('/getListQuyen', functions.checkToken, settingController.getListQuyen);
router.post('/getListSoVanBan', formData.parse(), functions.checkToken, settingController.getListSoVanBan);
router.post('/getListFullSoVB', formData.parse(), functions.checkToken, settingController.getListFullSoVB);
router.post('/createSoVanBan', formData.parse(), functions.checkToken, settingController.createSoVanBan);
router.post('/updateSoVanBan', formData.parse(), functions.checkToken, settingController.updateSoVanBan);
router.post('/deleteSoVanBan', formData.parse(), functions.checkToken, settingController.deleteSoVanBan);

module.exports = router