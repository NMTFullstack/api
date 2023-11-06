const express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const functions = require('../../services/functions');
const com = require('../../controllers/raonhanh365/company');

router.post('/comInfo', functions.checkToken, com.comInfo);

//api tao tao khoan doanh nghiep
router.post('/createCom', formData.parse(), com.getAndCheckData, com.createCompany);

//api cap nhat thong tin doanh nghiep
router.put('/updateCom', formData.parse(), [functions.checkToken], com.getAndCheckData, com.updateCompany);

//thong tin chi tiet cua doanh nghiep
router.get('/detailCom', formData.parse(), [functions.checkToken], com.getCompanyById);


module.exports = router;