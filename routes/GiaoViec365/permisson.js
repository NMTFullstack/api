const express = require('express');
const router = express.Router();
const formData = require('express-form-data');
const gv = require('../../services/giaoviec365/gvService')
const functions = require('../../services/functions')

const PermissionController = require('../../controllers/giaoviec365/PermissionController')

router.post('/quan-ly-vai-tro/add', functions.checkToken, gv.showListRole, formData.parse(), PermissionController.addVaiTro)
router.post('/quan-ly-vai-tro/edit/:id', functions.checkToken, gv.showListRole, formData.parse(), PermissionController.editVaiTro)
router.post('/quan-ly-vai-tro/delete/:id', functions.checkToken, gv.showListRole, PermissionController.deleteVaiTro)
router.post('/quan-ly-vai-tro/:page', functions.checkToken, gv.showListRole, PermissionController.VaiTro)
router.post('/quan-ly-vai-tro', functions.checkToken, gv.showListRole, PermissionController.VaiTro)
router.post('/chi-tiet-vai-tro/:id', functions.checkToken, gv.showListRole, PermissionController.detailsVaitro)

router.post('/quan-ly-nguoi-dung/:page', functions.checkToken, gv.showListRole, PermissionController.userRole)
router.post('/quan-ly-nguoi-dung', functions.checkToken, gv.showListRole, PermissionController.userRole)
router.post('/quan-ly-nguoi-dung/edit/:id', functions.checkToken, gv.showListRole, formData.parse(), PermissionController.editRole)


module.exports = router