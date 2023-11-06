const router = require('express').Router();
const functions = require("../../services/functions")
const Applications = require("../../controllers/qlc/AppUsers")
var formData = require('express-form-data')

//
router.post("/create", formData.parse(), functions.checkToken, Applications.create)
router.post("/list", formData.parse(), functions.checkToken, Applications.getlist)
router.post("/listAppOfUsers", formData.parse(), functions.checkToken, Applications.listAppOfUsers)
router.post("/getlistAppCountMember", formData.parse(), functions.checkToken, Applications.getlistAppCountMember)
router.post("/delete", formData.parse(), functions.checkToken, Applications.delete)

module.exports = router