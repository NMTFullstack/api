const express = require('express');
const router = express.Router();

const AccountController = require('../../controllers/giaoviec365/AccountController')

router.get('/lua-chon-dang-nhap',AccountController.choose_login)
router.get('/lua-chon-dang-ki',AccountController.choose_register)
router.post('/dang-nhap-nhan-vien',AccountController.view_login_member)
router.post('/dang-nhap-cong-ty',AccountController.view_login_company)
router.post('/dang-ki-cong-ty',AccountController.register_company)
router.post('/dang-ki-nhan-vien',AccountController.register_member)
router.get('/quen-mat-khau',AccountController.forgot_pass)
router.post('/khoi-phuc-mat-khau', AccountController.get_pass)
router.get('dang-ki-thanh-cong', AccountController.register_complete)
router.post('xac-thuc-dang-ki', AccountController.verification_register)
router.get('khoi-phuc-mat-khau-thanh-cong', AccountController.get_pass_complete)
router.get('nhap-ma-xac-minh', AccountController.verification_account)

module.exports = router