const express = require('express');
const router = express.Router();
const fc = require('../../services/functions')
const upload = require('../../services/giaoviec365/upload')
const formData = require("express-form-data")
const gv = require('../../services/giaoviec365/gvService')
const MeController = require('../../controllers/giaoviec365/MeController')

router.post('/cong-viec-cua-toi', fc.checkToken, gv.showListRole, MeController.congViecCuaToi)

router.post('/chi-tiet-cong-viec-cua-toi/project/:id/add-file', gv.pathFolderProject, upload.any('my-file'), fc.checkToken, gv.showListRole, MeController.themFileCongViec )
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/delete-file/:fileId', fc.checkToken, gv.showListRole, MeController.xoaFileCongViec)
router.get('/chi-tiet-cong-viec-cua-toi/project/:id/download-file/:fileId', MeController.taiFileCongViec)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/switch-job-of-job/:jojId', formData.parse(), fc.checkToken, gv.showListRole, MeController.switchJobOfJob)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/delete-job-of-job/:jojId', formData.parse(), fc.checkToken, gv.showListRole, MeController.xoaJobOfJob)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/edit-job-of-job/:jojId', formData.parse(), fc.checkToken, gv.showListRole, MeController.suaJobOfJob)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/add-job-of-job', formData.parse(), fc.checkToken, gv.showListRole, MeController.themJobOfJob)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/add-comment', formData.parse(), fc.checkToken, gv.showListRole, MeController.themBinhLuanCongViec)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/delete-comment/:commentId', formData.parse(), fc.checkToken, gv.showListRole, MeController.xoaBinhLuanCongViec)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/cap-nhap-danh-gia', fc.checkToken, gv.showListRole, formData.parse(), MeController.CapNhapDanhGiaDuAn)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id/chinh-sua-ket-qua', fc.checkToken, gv.showListRole, formData.parse(), MeController.thayDoiKetQuaDuAn)
router.post('/chi-tiet-cong-viec-cua-toi/project/:id', fc.checkToken, gv.showListRole, MeController.chiTietCongViecProject)

router.post('/chi-tiet-cong-viec-cua-toi/process/:id/add-file', gv.pathFolderProcess, upload.any('my-file'), fc.checkToken, gv.showListRole, MeController.themFileNhiemVu )
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/delete-file/:fileId', fc.checkToken, gv.showListRole, MeController.xoaFileNhiemVu)
router.get('/chi-tiet-cong-viec-cua-toi/process/:id/download-file/:fileId', MeController.taiFileNhiemVu)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/delete-comment/:commentId', fc.checkToken, gv.showListRole, formData.parse(), MeController.xoaBinhLuanNhiemVu)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/edit-comment/:commentId', fc.checkToken, gv.showListRole, formData.parse(), MeController.suaBinhLuanNhiemVu)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/add-comment', fc.checkToken, gv.showListRole, formData.parse(), MeController.themBinhLuanNhiemVu)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/cap-nhap-danh-gia', fc.checkToken, gv.showListRole, formData.parse(), MeController.CapNhapDanhGia)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/switch-mission-job/:missionJobId', formData.parse(), fc.checkToken, gv.showListRole, MeController.switchMissionJob)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/delete-mission-job/:missionJobId', fc.checkToken, gv.showListRole, formData.parse(), MeController.xoaMissionJob)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/edit-mission-job/:missionJobId', fc.checkToken, gv.showListRole, formData.parse(), MeController.suaMissionJob)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/add-mission-job', fc.checkToken, gv.showListRole, formData.parse(), MeController.themMissionJob)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id/chinh-sua-ket-qua', fc.checkToken, gv.showListRole, formData.parse(), MeController.thayDoiKetQuaNhiemVu)
router.post('/chi-tiet-cong-viec-cua-toi/process/:id', fc.checkToken, gv.showListRole, MeController.chiTietCongViecProcess)

router.post('/quan-ly-bao-cao-quy-trinh-nhan-vien/', fc.checkToken, gv.showListRole, MeController.quanLyBaoCaoQuyTrinhNhanVien)
router.post('/quan-ly-bao-cao-du-an-nhan-vien', fc.checkToken, gv.showListRole, MeController.QuanLyBaoCaoDuAnNhanVien)

router.post('/quan-ly-bao-cao-quy-trinh-nhan-vien-chi-tiet/:id', fc.checkToken, gv.showListRole, MeController.quanLyBaoCaoQuyTrinhNhanVienChiTiet)
router.post('/quan-ly-bao-cao-du-an-nhan-vien-chi-tiet/:id', fc.checkToken, gv.showListRole, MeController.quanLyBaoCaoDuAnNhanVienChiTiet)

module.exports = router