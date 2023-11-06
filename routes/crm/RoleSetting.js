const router = require("express").Router();
const formData = require('express-form-data')
const controller = require("../../controllers/crm/RoleSetting")
const functions = require('../../services/functions')
const controllers = require("../../controllers/crm/Nhap_lieu");

// API Phan quyen
router.post("/role-setting", functions.checkToken, formData.parse(), controller.setRole)

// API show Quyen 
router.post("/show-role", functions.checkToken, formData.parse(), controller.showRole)

module.exports = router
