const router = require('express').Router();
const controller = require('../../controllers/qlc/Permission')
const formData = require('express-form-data')
const functions = require("../../services/functions")

router.post('/add', functions.checkToken, formData.parse(), controller.add);
router.post('/check_role', functions.checkToken, formData.parse(), controller.check_role);
module.exports = router