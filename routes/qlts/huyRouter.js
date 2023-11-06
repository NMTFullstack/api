var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/huyController")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const QLTS = require('../../services/QLTS/qltsService');

// tạo đề xuất tài sản huỷ
router.post('/createAssetProposeCancel',functions.checkToken,QLTS.checkRole('M_H_TL',2),formData.parse(),controller.createAssetProposeCancel)

// danh sách đề xuất tài sản huỷ
router.post('/getDataAssetProposeCancel',functions.checkToken,QLTS.checkRole('M_H_TL',1),formData.parse(),controller.getDataAssetProposeCancel)

// duyệt đề xuất tài sản huỷ
router.post('/approveAssetDisposal',functions.checkToken,QLTS.checkRole('M_H_TL',4),formData.parse(),controller.approveAssetDisposal)

// từ chối đề xuất tài sản huỷ
router.post('/rejectAssetDisposal',functions.checkToken,QLTS.checkRole('M_H_TL',4),formData.parse(),controller.rejectAssetDisposal)

// xoá đề xuất tài sản huỷ
router.post('/deleteAssetDisposal',functions.checkToken,QLTS.checkRole('M_H_TL',3),formData.parse(),controller.deleteAssetDisposal)

// chi tiết đề xuất tài sản huỷ
router.get('/detailAssetDisposal',functions.checkToken,QLTS.checkRole('M_H_TL',1),controller.detailAssetDisposal)

// chỉnh sửa đề xuất tài sản huỷ
router.put('/updateAssetDisposal',functions.checkToken,QLTS.checkRole('M_H_TL',2),formData.parse(),controller.updateAssetDisposal)

// danh sách tài sản đã huỷ
router.post('/listOfDestroyedAssets',functions.checkToken,QLTS.checkRole('M_H_TL',1),formData.parse(),controller.listOfDestroyedAssets)

//xuất excel đề xuất hủy
router.get('/excelDXHuy/:_id', controller.excelDXHuy)

//xuất excel đa hủy
router.get('/excelDaHuy/:_id', controller.excelDaHuy)

module.exports = router