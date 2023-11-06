var express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const controllerNhomTs =  require('../../controllers/qlts/nhomTs');
const functions = require('../../services/functions')
const QLTS = require('../../services/QLTS/qltsService');

router.get('/excel/:_id', controllerNhomTs.ExportExcel)

//Api thêm mới
router.post('/add',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.addNhomTaiSan)

//Api hiển thị + dổ danh sách tìm kiếm
router.post('/list',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.showNhomTs)

//Api đổ data để sửa nhóm
router.post('/Nhomdata',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.showdataCT)

//Api hiển thị chi tiết nhóm
router.post('/details',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.showCTNhomTs)

//Api sửa 
router.post('/edit',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.editNhom)

//Api xóa
router.post('/delete',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.xoaNhom)

//Api hiển thị thông tin tùy chỉnh phần nhóm
router.post('/listTttc',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.listTTPBnhom)

//Api thêm mới thông tin tùy chỉnh nhóm
router.post('/addTTTC',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.addTTPB)

//Api chi tiết thông tin tùy chỉnh
router.post('/detailsTTTC',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.detailsTTTC)

//Api thông tin tùy chỉnh
router.post('/editTTTC',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.editTTTC);

//Api xóa thông tin tùy chỉnh
router.post('/deleteTTTC',functions.checkToken,QLTS.checkRole("TS",1),formData.parse(),controllerNhomTs.deleteTTTC);
module.exports = router