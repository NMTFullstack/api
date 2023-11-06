const router = require("express").Router()
const controller = require("../../controllers/qlc/Location")
const formData = require("express-form-data")

const functions = require("../../services/functions")


router.post("/list", functions.checkToken, formData.parse(), controller.getList);

router.post("/add", functions.checkToken, formData.parse(), controller.add);

router.post("/update", functions.checkToken, formData.parse(), controller.update);

router.post("/delete", functions.checkToken, formData.parse(), controller.delete);

module.exports = router