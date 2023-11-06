const express = require('express');
const router = express.Router();

const upload = require('../../services/giaoviec365/upload')
const formData = require('express-form-data');
const gv = require('../../services/giaoviec365/gvService')
const functions = require('../../services/functions')

const FileController = require('../../controllers/giaoviec365/FileController')

router.get('/quan-ly-tai-lieu-cong-viec/tai-xuong-tai-lieu/:id', FileController.taiXuongTaiLieu)
router.post('/quan-ly-tai-lieu-cong-viec/xoa-tai-lieu/:id', functions.checkToken, gv.showListRole, FileController.xoaTaiLieu)
router.post('/quan-ly-tai-lieu-cong-viec/them-tai-lieu', functions.checkToken, gv.showListRole, gv.pathFolderJob, upload.any('file'), FileController.taiLenTaiLieu)
router.post('/quan-ly-tai-lieu-cong-viec/:page', functions.checkToken, gv.showListRole, FileController.quanLyTaiLieuCongViec)
router.post('/quan-ly-tai-lieu-cong-viec', functions.checkToken, gv.showListRole, FileController.quanLyTaiLieuCongViec)

router.get('/quan-ly-tai-lieu-cua-toi/tai-xuong-tai-lieu/:id', FileController.taiXuongTaiLieuCuaToi)
router.post('/quan-ly-tai-lieu-cua-toi/xoa-tai-lieu/:id', functions.checkToken, gv.showListRole, FileController.xoaTaiLieu)
router.post('/quan-ly-tai-lieu-cua-toi/them-tai-lieu', functions.checkToken, gv.showListRole, gv.pathFolderJob, upload.any('file'), FileController.taiLenTaiLieu)
router.post('/quan-ly-tai-lieu-cua-toi', functions.checkToken, gv.showListRole, FileController.quanLyTaiLieuCuaToi)
router.post('/quan-ly-tai-lieu-cua-toi/:page', functions.checkToken, gv.showListRole, FileController.quanLyTaiLieuCuaToi)


router.post('/chi-tiet-tai-lieu/:id/delete-comment/:commentId', functions.checkToken, gv.showListRole, formData.parse(), FileController.xoaFileComment)
router.post('/chi-tiet-tai-lieu/:id/edit-comment/:commentId', functions.checkToken, gv.showListRole, formData.parse(), FileController.suaFileComment)
router.post('/chi-tiet-tai-lieu/:id/add-comment', functions.checkToken, gv.showListRole, formData.parse(), FileController.themFileComment)
router.post('/chi-tiet-tai-lieu/:id', functions.checkToken, gv.showListRole, FileController.chiTietTaiLieu)

router.post('/chi-tiet-tai-lieu-cua-toi/:id/delete-comment/:commentId', functions.checkToken, gv.showListRole, formData.parse(), FileController.xoaFileCommentCuaToi)
router.post('/chi-tiet-tai-lieu-cua-toi/:id/edit-comment/:commentId', functions.checkToken, gv.showListRole, formData.parse(), FileController.suaFileCommentCuaToi)
router.post('/chi-tiet-tai-lieu-cua-toi/:id/add-comment', functions.checkToken, gv.showListRole, formData.parse(), FileController.themFileCommentCuaToi)
router.post('/chi-tiet-tai-lieu-cua-toi/:id', functions.checkToken, gv.showListRole, FileController.chiTietTaiLieuCuaToi)

module.exports = router