var express = require('express');
var router = express.Router();
const controller = require("../../controllers/qlts/phanQuyen")
const formData = require("express-form-data")
const functions = require('../../services/functions');
const fnc = require('../../services/QLTS/qltsService')


router.post('/create',functions.checkToken,fnc.checkRole("PQ",2) ,formData.parse(),controller.create)
// fnc.checkRole("PQ",1) ,
router.post('/list',functions.checkToken,fnc.checkRole("PQ",1) , formData.parse(),controller.list)

module.exports = router
 