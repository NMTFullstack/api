const router = require("express").Router()
const controller = require("../../controllers/DanhGiaNangLuc/CaiDat/CaiDat")
const formData = require("express-form-data")
const functions = require('../../services/functions')


router.post('/showSetting',functions.checkToken,formData.parse(),controller.renderItem)
router.post('/thietLapTd',formData.parse(),controller.addPhanLoai)
router.get('/getDataPoint',functions.checkToken,controller.ThangDiem)

module.exports = router