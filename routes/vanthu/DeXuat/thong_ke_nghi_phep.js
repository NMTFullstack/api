const router = require('express').Router();
const formData = require("express-form-data");
const controller = require('../../../controllers/vanthu/DeXuat/thong_ke_nghi_phep');
const functions = require('../../../services/functions')

router.post('/danh_sach_nghi_phep',functions.checkToken, formData.parse(), controller.thong_ke_nghi_phep);

module.exports = router;