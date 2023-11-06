const router = require('express').Router()
const formData = require('express-form-data')
const controllers = require('../../../controllers/qlts/SuaChua_BaoDuong/SuaChua')
const functions = require('../../../services/functions')
const fnc = require('../../../services/QLTS/qltsService')

router.post(
  '/deleteAll',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.deleteAll
) // xoa , khoi phuc , xoa vinh vien nhieu bien ban cung luc
//bien ban dang sua chua

router.post(
  '/HoanThanhSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.HoanThanhSuaChua
)
router.post(
  '/EditSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 2),
  formData.parse(),
  controllers.SuaChuaBB
)
router.post(
  '/deleteBBSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.XoabbSuaChua
)
router.post(
  '/details_bien_ban_dang_sua_chua',
  functions.checkToken,
  formData.parse(),
  controllers.details
)
router.post(
  '/list_bien_ban_dang_sua_chua',
  functions.checkToken,
  formData.parse(),
  controllers.listBBDangSuaChua
)
//bien ban da sua chua
router.post(
  '/xoa_bien_ban_da_sua_chua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.xoa_bb_sua_chua
)
router.post(
  '/xoa_cac_bien_ban_da_sua_chua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.xoa_all
)
router.post(
  '/chi_tiet_bien_ban_da_sua_chua',
  functions.checkToken,
  formData.parse(),
  controllers.details_bb_da_sua_chua
)
router.post(
  '/list_bien_ban_da_sua_chua',
  functions.checkToken,
  formData.parse(),
  controllers.listBBDaSuaChua
)

//tai san can sua chua
router.post(
  '/addSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 2),
  formData.parse(),
  controllers.addSuaChua
)
router.post(
  '/TuChoiBienBanSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 4),
  formData.parse(),
  controllers.tuChoiSC
)
router.post(
  '/deleteBBCanSuaChua',
  functions.checkToken,
  fnc.checkRole('SC_BD', 3),
  formData.parse(),
  controllers.xoaBBcanSC
)
router.post(
  '/detailBBCanSuaChua',
  functions.checkToken,
  formData.parse(),
  controllers.detailBBCanSuaChua
)
router.post(
  '/list',
  functions.checkToken,
  formData.parse(),
  controllers.listBBCanSuaChua
)
router.post(
  '/deleteMany',
  functions.checkToken,
  formData.parse(),
  controllers.deleteMany
)

router.post(
  '/listAllSuaChua',
  functions.checkToken,
  formData.parse(),
  controllers.listAllSuaChua
)
router.get('/CanSCExcel/:_id', controllers.CanSCExcel)
router.get('/DangSCExcel/:_id', controllers.DangSCExcel)
router.get('/DaSCExcel/:_id', controllers.DaSCExcel)

module.exports = router
