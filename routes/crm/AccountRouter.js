const router = require('express').Router();
const formData = require("express-form-data");
const controllers = require("../../controllers/crm/account");
const funtions = require('../../services/functions')

router.post('/employee/list', funtions.checkToken, formData.parse(), controllers.getListEmployee);
module.exports = router;