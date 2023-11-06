// luồng ứng viên
var express = require('express');
var router = express.Router();
var formData = require('express-form-data');
//const functions = require('../../services/functions');
const company = require('../../../controllers/timviec/admin/company');
// Danh sách ứng viên đăng ký mới
router.post('/list/register', formData.parse(), company.listRegister);
// Danh sách ứng viên sửa, cập nhật hồ sơ
// router.post('/list/update', formData.parse(), candidate.candi_update);
// // Ứng viên tải cv từ máy tính cá nhân
// router.post('/list/checkProfile', formData.parse(), candidate.checkProfile);
// // duyệt hồ sơ ứng viên
// router.post('/profile/active', formData.parse(), candidate.activeProfile);
// // xóa ứng viên
// router.post('/delete', formData.parse(), candidate.delete);
// // ứng viên có điểm hồ sơ < 45
// router.post('/list/percents', formData.parse(), candidate.percents);
// // ứng viên ứng tuyển ntd
// router.post('/list/apply', formData.parse(), candidate.listApply);
// // ứng viên chưa kích hoạt
// router.post('/list/authentic', formData.parse(), candidate.listAuthentic);
// // ứng viên cv
// router.post('/list/cv', formData.parse(), candidate.listCandiSaveCv);
// // ứng viên đã xóa
// router.post('/list/deleted', formData.parse(), candidate.listDeleted);
module.exports = router;