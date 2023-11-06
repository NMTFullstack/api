const router = require('express').Router();
const controller = require('../../controllers/qlc/OrganizeDetail')
const formData = require('express-form-data')
const functions = require("../../services/functions")


router.post("/create", formData.parse(), functions.checkToken, controller.create)
router.post("/listAll", formData.parse(), controller.listAll)
router.post("/list", formData.parse(), functions.checkToken, controller.list)
router.post("/addListUser", formData.parse(), functions.checkToken, controller.addListUser)
router.post("/update", formData.parse(), functions.checkToken, controller.update)
router.post("/listUser", formData.parse(), functions.checkToken, controller.listUser)
router.post("/delete", formData.parse(), functions.checkToken, controller.delete)
router.post("/swap", formData.parse(), functions.checkToken, controller.swap)
router.post("/updatebyRange", formData.parse(), functions.checkToken, controller.updatebyRange)
router.post("/check", formData.parse(), functions.checkToken, controller.check)


module.exports = router