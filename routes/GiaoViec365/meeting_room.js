const express = require('express');
const router = express.Router();
const gv = require('../../services/giaoviec365/gvService')
const formData = require('express-form-data');
const functions = require('../../services/functions')

const MeetingRoomController = require('../../controllers/giaoviec365/MeetingRoomController')

router.post('/quan-ly-dia-diem/them-moi-dia-diem', functions.checkToken, gv.showListRole, formData.parse(), MeetingRoomController.themMoiDiaDiem)
router.post('/quan-ly-dia-diem/update/:id', functions.checkToken, gv.showListRole, formData.parse(), MeetingRoomController.suaDiaDiem)
router.post('/quan-ly-dia-diem/delete/:id', functions.checkToken, gv.showListRole, MeetingRoomController.xoaDiaDiem)
router.post('/quan-ly-dia-diem', functions.checkToken, gv.showListRole, MeetingRoomController.quanLyDiaDiem)
router.post('/quan-ly-dia-diem/:page', functions.checkToken, gv.showListRole, MeetingRoomController.quanLyDiaDiem)

router.post('/quan-ly-phong-hop/them-moi-phong-hop', functions.checkToken, gv.showListRole, formData.parse(), MeetingRoomController.themMoiPhongHop)
router.post('/quan-ly-phong-hop/update/:id', functions.checkToken, gv.showListRole, formData.parse(), MeetingRoomController.suaPhongHop)
router.post('/quan-ly-phong-hop/delete/:id', functions.checkToken, gv.showListRole, MeetingRoomController.xoaPhongHop)
router.post('/quan-ly-phong-hop', functions.checkToken, gv.showListRole, MeetingRoomController.quanLyPhongHop)
router.post('/quan-ly-phong-hop/:page', functions.checkToken, gv.showListRole, MeetingRoomController.quanLyPhongHop)

module.exports = router