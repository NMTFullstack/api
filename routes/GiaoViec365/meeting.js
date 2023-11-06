const express = require('express');
const router = express.Router();
const upload = require('../../services/giaoviec365/upload')
const formData = require('express-form-data');
const gv = require('../../services/giaoviec365/gvService')
const functions = require('../../services/functions')

const MeetingController = require('../../controllers/giaoviec365/MeetingController')

router.post('/quan-ly-cuoc-hop', functions.checkToken, gv.showListRole, MeetingController.quanLyCuocHop)
router.post('/quan-ly-cuoc-hop/them-cuoc-hop-truc-tiep', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.themCuocHopTrucTiep)
router.post('/quan-ly-cuoc-hop/them-cuoc-hop-truc-tuyen', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.themCuocHopTrucTuyen)
router.post('/chi-tiet-cuoc-hop/:id/edit', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.suaCuocHop)
router.post('/chi-tiet-cuoc-hop/:id/delete', functions.checkToken, gv.showListRole, MeetingController.xoaCuocHop)

router.post('/chi-tiet-cuoc-hop/:id/add-attachments', gv.pathFolderMeeting ,upload.any('file'), functions.checkToken, gv.showListRole, MeetingController.themTapTinDinhKem)
router.post('/chi-tiet-cuoc-hop/:id/delete-attachments/:attId', functions.checkToken, gv.showListRole, MeetingController.xoaTapTinDinhKem)
router.get('/chi-tiet-cuoc-hop/:id/download-attachments/:attId', MeetingController.taiTapTinDinhKem)

router.post('/chi-tiet-cuoc-hop/:id/add-protocol', gv.pathFolderMeeting ,upload.any('file'), functions.checkToken, gv.showListRole, MeetingController.themBienBanHop)
router.post('/chi-tiet-cuoc-hop/:id/delete-protocol/:protocolId', functions.checkToken, gv.showListRole, MeetingController.xoaBienBanHop)
router.get('/chi-tiet-cuoc-hop/:id/download-protocol/:protocolId',  MeetingController.taiBienBanHop)

router.post('/chi-tiet-cuoc-hop/:id/add-comment', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.themBinhLuan)
router.post('/chi-tiet-cuoc-hop/:id/delete-comment/:commentId', functions.checkToken, gv.showListRole, MeetingController.xoaBinhLuan)

router.post('/chi-tiet-cuoc-hop/cai-dat-tin-nhan-thong-bao', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.caiDatEmailNoti)
router.post('/chi-tiet-cuoc-hop/role', functions.checkToken, gv.showListRole, formData.parse(), MeetingController.quanLyPhanQuyen)
router.get('/chi-tiet-cuoc-hop/:id/export-excel', MeetingController.xuatExcel)
router.post('/chi-tiet-cuoc-hop/:id/huy-cuoc-hop', functions.checkToken, gv.showListRole, MeetingController.huyCuocHop)

router.post('/chi-tiet-cuoc-hop/:id/sua-thanh-vien-cuoc-hop', functions.checkToken, formData.parse(), gv.showListRole, MeetingController.chinhSuaThanhVienCuocHop)
router.post('/chi-tiet-cuoc-hop/:id', functions.checkToken, gv.showListRole, MeetingController.chiTietCuocHop)

module.exports = router