var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/TrangChu")
const formData = require("express-form-data")
const functions = require('../../services/functions');

router.post('/Home',functions.checkToken ,formData.parse(),controller.Home)


module.exports = router