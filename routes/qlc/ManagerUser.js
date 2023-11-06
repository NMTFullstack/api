const router = require('express').Router()
const managerUserController = require('../../controllers/qlc/ManageUser')
const formData = require('express-form-data')
const functions = require('../../services/functions')

//API lấy danh sách nhân viên
router.post(
  '/list',
  formData.parse(),
  functions.checkToken,
  managerUserController.getlistAdmin
)

//API tạo mới một User
router.post(
  '/create',
  formData.parse(),
  functions.checkToken,
  managerUserController.createUser
)

//API thay dổi thông tin của một user
router.post(
  '/edit',
  formData.parse(),
  functions.checkToken,
  managerUserController.editUser
)

// API lấy toàn bộ nhân viên không phân trang
router.post('/listAll', functions.checkToken, managerUserController.listAll)

router.post(
  '/checkAuthen',
  functions.checkToken,
  managerUserController.checkAuthen
)

// API xóa nhân viên ra khỏi công ty
router.post(
  '/del',
  formData.parse(),
  functions.checkToken,
  managerUserController.deleteUser
)
router.post(
  '/del/dep',
  formData.parse(),
  functions.checkToken,
  managerUserController.deleteUser_Deparment
)

// đổi loại tài khoản (từ công ty A sang B)
router.post(
  '/changeCompany',
  formData.parse(),
  functions.checkToken,
  managerUserController.changeCompany
)

// duyệt người dùng
router.post(
  '/acceptEmployee',
  formData.parse(),
  functions.checkToken,
  managerUserController.acceptEmployee
)

// verify CAPTCHA
router.post(
  '/verifyCaptcha',
  formData.parse(),
  managerUserController.verifyCaptcha
)

// thay đổi phòng ban, tổ, nhóm, vị trí
router.post(
  '/changeDepartment',
  formData.parse(),
  functions.checkToken,
  managerUserController.changeDepartment
)
router.post(
  '/verifyListUsers',
  formData.parse(),
  functions.checkToken,
  managerUserController.verifyListUsers
)

router.post(
  '/listAllPending',
  formData.parse(),
  functions.checkToken,
  managerUserController.listEmpPending
)
router.post(
  '/listAllFilter',
  formData.parse(),
  functions.checkToken,
  managerUserController.listAllActive
)
router.post(
  '/delListUsers',
  formData.parse(),
  functions.checkToken,
  managerUserController.delListUsers
)
// -------------------------------------- Mới -------------------------

router.post(
  '/listUser',
  formData.parse(),
  functions.checkToken,
  managerUserController.listUser
)
router.post(
  '/createUserNew',
  formData.parse(),
  functions.checkToken,
  managerUserController.createUserNew
)
router.post(
  '/changeOrganizeDetail',
  formData.parse(),
  functions.checkToken,
  managerUserController.changeOrganizeDetail
)
router.post(
  '/deleteCompany',
  formData.parse(),
  functions.checkToken,
  managerUserController.deleteCompany
)
// duyệt list nhân viên
router.post(
  '/verify',
  formData.parse(),
  functions.checkToken,
  managerUserController.verifyListUsersNew
)

// từ chối duyệt list
router.post(
  '/reject',
  formData.parse(),
  functions.checkToken,
  managerUserController.rejectListUsers
)

// thông tin công ty
router.post(
  '/infoCompany',
  formData.parse(),
  functions.checkToken,
  managerUserController.infoCompany
)

// phân quyền admin
router.post(
  '/updateAdmin',
  formData.parse(),
  functions.checkToken,
  managerUserController.updateAdmin
)

// danh sách chấm công
router.post(
  '/listEmUntimed',
  formData.parse(),
  functions.checkToken,
  managerUserController.listEmUntimed
)

// thêm nhân viên mới + lương + hợp đồng
router.post(
  '/createUserAndSalary',
  formData.parse(),
  functions.checkToken,
  managerUserController.createUserAndSalary
)

module.exports = router
