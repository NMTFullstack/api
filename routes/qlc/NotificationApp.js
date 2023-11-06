const router = require('express').Router();
const controller = require('../../controllers/qlc/OrganizeDetail')
const formData = require('express-form-data')
const functions = require("../../services/functions")


router.post("/list", formData.parse(), functions.checkToken, controller.list)

module.exports = router