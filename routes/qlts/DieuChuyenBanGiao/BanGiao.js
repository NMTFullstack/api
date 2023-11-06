const router = require('express').Router();
const formData = require('express-form-data');
const controllers = require('../../../controllers/qlts/dieu_chuyen_ban_giao/BanGiao');
const functions = require('../../../services/functions');
const fnc = require('../../../services/QLTS/qltsService')



router.post('/list', functions.checkToken, formData.parse(), controllers.list);

router.post('/listDetailAllocation', functions.checkToken, formData.parse(), controllers.listDetailAllocation);

router.post('/listDetailRecall', functions.checkToken, formData.parse(), controllers.listDetailRecall);

router.post('/refuserHandOver', functions.checkToken,fnc.checkRole("DC_BG",4), formData.parse(), controllers.refuserHandOver);

module.exports = router;