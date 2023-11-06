const express = require('express');
const router = express.Router();
const formData = require('express-form-data');
const gv = require('../../services/giaoviec365/gvService')
const functions = require('../../services/functions');

const DeletedDataController = require('../../controllers/giaoviec365/DeletedDataController')
router.post('/quan-ly-du-lieu-da-xoa-gan-day/:page',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyDuLieuDaXoaGanDay)
router.post('/quan-ly-du-lieu-da-xoa-gan-day',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyDuLieuDaXoaGanDay)

router.post('/quan-ly-tai-lieu-da-xoa-gan-day/force-delete', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.xoaVinhVienTaiLieu)
router.post('/quan-ly-tai-lieu-da-xoa-gan-day/restore', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.khoiPhucTaiLieu)
router.post('/quan-ly-tai-lieu-da-xoa-gan-day/:page',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyTaiLieuDaXoaGanDay)
router.post('/quan-ly-tai-lieu-da-xoa-gan-day',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyTaiLieuDaXoaGanDay)

router.post('/quan-ly-cuoc-hop-da-xoa-gan-day/force-delete', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.xoaVinhVienCuocHop)
router.post('/quan-ly-cuoc-hop-da-xoa-gan-day/restore', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.khoiPhucCuocHop)
router.post('/quan-ly-cuoc-hop-da-xoa-gan-day/:page',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyCuocHopDaXoaGanDay)
router.post('/quan-ly-cuoc-hop-da-xoa-gan-day',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyCuocHopDaXoaGanDay)

router.post('/quan-ly-du-an-da-xoa-gan-day/force-delete', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.xoaVinhVienDuAn)
router.post('/quan-ly-du-an-da-xoa-gan-day/restore', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.khoiPhucDuAn)
router.post('/quan-ly-du-an-da-xoa-gan-day/:page',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyDuAnDaXoaGanDay)
router.post('/quan-ly-du-an-da-xoa-gan-day',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyDuAnDaXoaGanDay)

router.post('/quan-ly-quy-trinh-da-xoa-gan-day/force-delete', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.xoaVinhVienQuyTrinh)
router.post('/quan-ly-quy-trinh-da-xoa-gan-day/restore', functions.checkToken, gv.showListRole, formData.parse(),  DeletedDataController.khoiPhucQuyTrinh)
router.post('/quan-ly-quy-trinh-da-xoa-gan-day/:page',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyQuyTrinhDaXoaGanDay)
router.post('/quan-ly-quy-trinh-da-xoa-gan-day/',functions.checkToken, gv.showListRole,  DeletedDataController.quanLyQuyTrinhDaXoaGanDay)

module.exports = router