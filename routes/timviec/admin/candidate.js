// luồng ứng viên
var express = require('express');
var router = express.Router();
var formData = require('express-form-data');
//const functions = require('../../services/functions');
const candidate = require('../../../controllers/timviec/admin/candidate');
// Danh sách ứng viên đăng ký mới
router.post('/list/register', formData.parse(), candidate.candi_register);
// Danh sách ứng viên sửa, cập nhật hồ sơ
router.post('/list/update', formData.parse(), candidate.candi_update);
// Ứng viên tải cv từ máy tính cá nhân
router.post('/list/checkProfile', formData.parse(), candidate.checkProfile);
// duyệt hồ sơ ứng viên
router.post('/profile/active', formData.parse(), candidate.activeProfile);
// xóa ứng viên
router.post('/delete', formData.parse(), candidate.delete);
// ứng viên có điểm hồ sơ < 45
router.post('/list/percents', formData.parse(), candidate.percents);
// ứng viên ứng tuyển ntd
router.post('/list/apply', formData.parse(), candidate.listApply);
// ứng viên chưa kích hoạt
router.post('/list/authentic', formData.parse(), candidate.listAuthentic);
// ứng viên cv
router.post('/list/cv', formData.parse(), candidate.listCandiSaveCv);
// ứng viên đã xóa
router.post('/list/deleted', formData.parse(), candidate.listDeleted);
// ứng viên add lỗi 
router.post('/takeListUserAddFail', formData.parse(), candidate.takeListUserAddFail);
// ứng viên ứng tuyển sai
router.post('/candi_apply_wrong', formData.parse(), candidate.candi_apply_wrong);
// ứng viên bị kinh doanh ẩn 
router.post('/candi_hide_kd', formData.parse(), candidate.candi_hide_kd);
// ứng viên bị ẩn 
router.post('/candi_hide', formData.parse(), candidate.candi_hide);
// ứng viên đăng nhập trong ngày 
router.post('/candi_login', formData.parse(), candidate.candi_login);
// Lam mới
router.post('/refreshCandi', formData.parse(), candidate.refreshCandi);


module.exports = router;