const router = require("express").Router()
const controller = require("../../../controllers/qlc/admin/Admin")
const formData = require("express-form-data")
const functions = require("../../../services/functions")

//check vip

router.post("/vip", formData.parse(), controller.setVip)

router.post("/put", formData.parse(), controller.setVipOnly)

router.post("/listCom", formData.parse(), controller.listCom)

router.post("/listComSummary", formData.parse(), controller.listComSummary)

router.post("/listComErr", formData.parse(), controller.listComErr)

router.post("/updatePassword", formData.parse(), controller.updatePassword)

router.post("/getListFeedback", formData.parse(), controller.getListFeedback)

router.post("/getListReportErr", formData.parse(), controller.getListReportErr)

router.post("/postBlog", formData.parse(), controller.createBlog)

router.post("/blog", formData.parse(), controller.getBlog)

router.post("/updateBlog", formData.parse(), controller.updateBlog)

module.exports = router