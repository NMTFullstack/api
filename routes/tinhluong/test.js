const router = require('express').Router();
const test = require("../../controllers/tinhluong/test") // file 
const formData = require('express-form-data');

//test
router.get('/',test.test);


module.exports = router