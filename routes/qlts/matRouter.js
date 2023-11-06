var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/matController");
const formData = require("express-form-data");
const functions = require('../../services/functions');
const QLTS = require('../../services/QLTS/qltsService');

router.post('/danhSachTaiBaoMat', functions.checkToken, QLTS.checkRole('M_H_TL'), formData.parse(), controller.danhSachTaiBaoMat);

router.post('/danhSachChoDenBuVaMat', functions.checkToken, QLTS.checkRole('M_H_TL'), formData.parse(), controller.danhSachChoDenBuVaMat);

router.post('/createMat', functions.checkToken, QLTS.checkRole('M_H_TL',2), formData.parse(), controller.createMat);

router.post('/deleteMat', functions.checkToken, QLTS.checkRole('M_H_TL',4), formData.parse(), controller.deleteMat);

router.post('/deleteMany', functions.checkToken, QLTS.checkRole('M_H_TL',4), formData.parse(), controller.deleteMany);

router.post('/duyet', functions.checkToken, QLTS.checkRole('M_H_TL',3), formData.parse(), controller.duyet);

router.post('/tuChoi', functions.checkToken, QLTS.checkRole('M_H_TL',3), formData.parse(), controller.tuChoi);

router.post('/hoanThanh', functions.checkToken, QLTS.checkRole('M_H_TL',3), formData.parse(), controller.hoanThanh);

router.get('/excel/:id/:_id', controller.ExportExcel)
module.exports = router