const router = require('express').Router()
const Controller = require('../../controllers/qlc/TimeSheet')
    // const functions= require ("../../services/functions")
const formData = require('express-form-data')
const functions = require('../../services/functions')

// lịch sử chấm công được ghi lại
router.post(
    '/create/web',
    functions.checkToken,
    formData.parse(),
    Controller.SaveForWeb
)
router.post(
    '/create/webComp',
    functions.checkToken,
    formData.parse(),
    Controller.SaveForWebComp
)

router.post(
    '/create/winform',
    functions.checkToken,
    formData.parse(),
    Controller.saveHisForWinform
)

router.post(
    '/getLatestInOutUser',
    functions.checkToken,
    formData.parse(),
    Controller.getLatestInOutUser
)

router.post(
    '/filterComp',
    functions.checkToken,
    formData.parse(),
    Controller.filterCompData
)

router.post(
    '/create/webNew',
    functions.checkToken,
    formData.parse(),
    Controller.saveHisForWebNew
)

// chấm công app

router.post(
    '/create/app',
    functions.checkToken,
    formData.parse(),
    Controller.saveHisForApp
)

router.post(
    '/create/saveHisWebEmp',
    functions.checkToken,
    formData.parse(),
    Controller.saveHisWebEmp
)

router.post(
    '/com/success',
    formData.parse(),
    Controller.getListUserTrackingSuccess
)
router.post(
    '/com/false',
    formData.parse(),
    Controller.getlistUserNoneHistoryOfTracking
)
router.post(
    '/employee/home',
    functions.checkToken,
    formData.parse(),
    Controller.EmployeeHome
)

router.post(
    '/employee/splitTimeKeeping',
    formData.parse(),
    Controller.splitTimeKeeping
)

// Lịch sử điểm danh theo tài khoản công ty
router.post(
    '/get_history_time_keeping_by_company',
    functions.checkToken,
    formData.parse(),
    Controller.get_history_time_keeping_by_company
)

router.post(
    '/getHistoryCheckin',
    functions.checkToken,
    formData.parse(),
    Controller.getCompHistoryCheckin
)

router.post(
    '/getListEmpSimple',
    functions.checkToken,
    formData.parse(),
    Controller.getListEmpSimple
)

router.post(
    '/getHistoryTrackingEmp',
    functions.checkToken,
    formData.parse(),
    Controller.getHistoryTrackingEmp
)
module.exports = router