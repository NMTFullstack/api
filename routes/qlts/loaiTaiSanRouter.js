var express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const controllerLoaiTs =  require('../../controllers/qlts/loaiTaiSan');
const functions = require('../../services/functions')
const QLTS = require('../../services/QLTS/qltsService');

router.get('/excel/:_id', controllerLoaiTs.ExportExcel)

//Api thêm mới + tìm kiếm
router.post('/add',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerLoaiTs.addLoaiTaiSan)

//Api hiển thị
router.post('/list',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerLoaiTs.showLoaiTs)

//Api sửa loại
router.post('/edit',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerLoaiTs.editLoaiTs)

//Api xóa loại
router.post('/delete',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerLoaiTs.deleteLoaiTs)

//Api chi tiết loại
router.post('/details',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerLoaiTs.detailsLoai)


module.exports = router