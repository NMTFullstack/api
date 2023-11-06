const router = require('express').Router();
const cateDeXuat = require('../../controllers/vanthu/CateDeXuat/cateDeXuat');
var formData = require('express-form-data');
const functions = require('../../services/functions')



//Api hiển thị trang home tài khoản công ty + nhân viên
router.post('/showHome',functions.checkToken,formData.parse(),cateDeXuat.showHome)


//Api hiển thị trang tài khoản nghỉ + không lịch làm việc + tìm kiếm
router.post('/showNghi',functions.checkToken,formData.parse(),cateDeXuat.showNghi)


//Api hiển thị chi tiết đề xuất
router.post('/showCTDX',functions.checkToken,formData.parse(),cateDeXuat.ChitietDx)


//Api thay đổi trạng thái Dx
router.post('/chageCate',functions.checkToken,formData.parse(),cateDeXuat.changeCate)


//Api tim theo tên gần đúng trang danh sách các loại đề xuất hiển thị danh sách các loại đề xuất 
router.post('/searchcate',functions.checkToken,formData.parse(),cateDeXuat.findNameCate)


//Api hiển thị trang thành viên công ty
router.post('/thanhvien',functions.checkToken,formData.parse(),cateDeXuat.findthanhVien)

//Api hiển thị các loại đề xuất mà không phân trang
router.post('/showlistcate',functions.checkToken,formData.parse(),cateDeXuat.showloaicate);

//Api hiển thị trang đề xuất tạm ứng danh sách
router.post('/tamung',functions.checkToken,formData.parse(),cateDeXuat.listtamung);

module.exports = router