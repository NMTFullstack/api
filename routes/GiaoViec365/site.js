const express = require('express');
const router = express.Router();
const functions = require('../../services/functions');
const SiteController = require('../../controllers/giaoviec365/SiteController')
const formData = require('express-form-data')
const gv = require('../../services/giaoviec365/gvService')

router.post('/quan-ly-chung-cong-ty', functions.checkToken, gv.showListRole, SiteController.quanLyChungCongTy)
router.post('/quan-ly-chung-nhan-vien', functions.checkToken, gv.showListRole, SiteController.quanLyChungNhanVien)

router.post('/cai-dat-sau-dang-nhap-quan-ly/cap-nhat-thong-tin-cong-ty', functions.checkToken, gv.showListRole, formData.parse(), SiteController.capNhatThongTinCongTy)
router.post('/cai-dat-sau-dang-nhap/sua-background', functions.checkToken, gv.showListRole, formData.parse(), SiteController.suaBackgroud)
router.post('/cai-dat-sau-dang-nhap-quan-ly', functions.checkToken, gv.showListRole, SiteController.caiDatSauDangNhapQuanLy)

router.post('/cai-dat-sau-dang-nhap-nhan-vien', functions.checkToken, gv.showListRole, SiteController.caiDatSauDangNhapNhanVien)

router.post('/showListDep', functions.checkToken, SiteController.showListDep)
router.post('/showConfigBackground', functions.checkToken, SiteController.showConfigBackground)
router.post('/showRoleProject', functions.checkToken, SiteController.showRoleProject)
router.post('/showRoleProcess', functions.checkToken, SiteController.showRoleProcess)
router.post('/showListAllProject', functions.checkToken, SiteController.showListAllProject)
router.post('/showListAllProcess', functions.checkToken, SiteController.showListAllProcess)


// router.post('/huong-dan', functions.checkToken, SiteController.howTo)
// router.post('/', functions.checkToken, SiteController.showHomePage)


module.exports = router