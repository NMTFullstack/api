const router = require('express').Router();
const homeController = require("../../../controllers/vanthu/GuiNhanCongVan/homeController");
var formData = require('express-form-data');
const functions = require('../../../services/functions');

router.post('/getTotalVanBan', functions.checkToken,formData.parse(),homeController.getTotalVanBan);

module.exports = router