const express = require('express');
const router = express.Router();
const functions = require("../../services/functions")

const controller = require('../../controllers/qlc/ShiftsNew')
const tool = require('../../controllers/tools/quanlichung')
const formData = require('express-form-data');

router.post("/create", functions.checkToken, formData.parse(), controller.create);

router.post("/list", functions.checkToken, formData.parse(), controller.list);

router.post("/edit", functions.checkToken, formData.parse(), controller.edit);

router.post('/delete', functions.checkToken, formData.parse(), controller.delete);

module.exports = router