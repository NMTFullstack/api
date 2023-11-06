var express = require('express')
var router = express.Router()
const formData = require('express-form-data')
const controllerTs = require('../../controllers/qlts/taiSan')
const functions = require('../../services/functions')
const QLTS = require('../../services/QLTS/qltsService')

router.get('/excel/:_id', controllerTs.ExportExcel)

//Api danh sach
router.post(
  '/list',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showAll
)

//Api show dữ liệu tìm kiếm danh sách
router.post(
  '/datasearch',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showDataSearch
)

//Api thêm mới
router.post(
  '/add',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.addTaiSan
)

//Api hiển thị dữ liệu thêm mới
router.post(
  '/showadd',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showadd
)

//Api hiển thị chi tiết tài sản
router.post(
  '/details',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showCTts
)

//Api hiển thị quá trình sử dụng
router.post(
  '/quatrinhSd',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.quatrinhsd
)

//Api hiển thị khấu hao
router.post(
  '/showkh',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.khauhaoCTTS
)

//Apo thêm khấu hao
router.post(
  '/addkhauhao',
  functions.checkToken,
  formData.parse(),
  controllerTs.addKhauHao
)

//Api tài liệu đính kèm
router.post(
  '/listFile',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showFile
)

router.post(
  '/addFile',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.addFile
)

router.post(
  '/deleteFile',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.deleteFile
)

//Api Bảo duongx theo chi tiết
router.post(
  '/showBDCT',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showBDCT
)

//Api sửa chữa theo chi tiết
router.post(
  '/showSCCT',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showScCT
)

//Api sửa chữa theo chi tiết
router.post(
  '/editTS',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.editTS
)

//Api xóa tài sản
router.post(
  '/delete',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.deleteTs
)

//Api hiển thị ghi tăng
router.post(
  '/DTghitang',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showGhiTang
)

//thêm mới ghi tăng
router.post(
  '/addghitang',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.addGhiTang
)

//duyệt ghi tăng
router.post(
  '/duyetGT',
  functions.checkToken,
  QLTS.checkRole('CP_TH', 1),
  formData.parse(),
  controllerTs.duyetHuyGhiTang
)

//xóa ghi tăng
router.post(
  '/Deleteghitang',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.XoaGhiTang
)

//sửa ghi tăng
router.post(
  '/Editghitang',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.chinhSuaGhitang
)

//Thông tin phân bổ
router.post(
  '/ShowTTPB',
  functions.checkToken,
  QLTS.checkRole('TS', 1),
  formData.parse(),
  controllerTs.showTTPB
)

//danh sach tai san dang sd
router.post(
  '/showDataCapitalUsed',
  functions.checkToken,
  formData.parse(),
  controllerTs.showDataCapitalUsed
)
module.exports = router
