const router = require('express').Router()
const Controllers = require('../../controllers/qlc/CompanyWebIP');
const functions = require("../../services/functions");
var formData = require('express-form-data');

router.post('/list', functions.checkToken, formData.parse(), Controllers.list);
router.post('/add', functions.checkToken, formData.parse(), Controllers.add);
router.post('/edit', functions.checkToken, formData.parse(), Controllers.edit);
router.post('/delete', functions.checkToken, formData.parse(), Controllers.delete);


module.exports = router