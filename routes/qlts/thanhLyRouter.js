var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/thanhLyController")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const QLTS = require('../../services/QLTS/qltsService');

// tạo đề xuất tài sản thanh lý
router.post('/createLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',2),formData.parse(),controller.createLiquidationAssetProposal)

// danh sách đề xuất tài sản thanh lý
router.post('/getDataLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',1),formData.parse(),controller.getDataLiquidationAssetProposal)

// duyệt đề xuất tài sản thanh lý
router.post('/approveLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',4),formData.parse(),controller.approveLiquidationAssetProposal)

// từ chối đề xuất tài sản thanh lý
router.post('/rejectLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',4),formData.parse(),controller.rejectLiquidationAssetProposal)

// xoá đề xuất tài sản thanh lý
router.delete('/deleteLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',3),formData.parse(),controller.deleteLiquidationAssetProposal)

// chi tiết xuất tài sản thanh lý
router.get('/detailLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',1),controller.detailLiquidationAssetProposal)

// danh sách đề xuất tài sản đã thanh lý
router.post('/getDataDidLiquidationAssetProposal',functions.checkToken,QLTS.checkRole('M_H_TL',1),formData.parse(),controller.getDataDidLiquidationAssetProposal)

//xuất excel đề xuất Thanh ly
router.get('/excelDXThanhLy/:_id', controller.excelDXThanhLy)

//xuất excel da thanh ly
router.get('/excelDaThanhLy/:_id', controller.excelDaThanhLy)

module.exports = router