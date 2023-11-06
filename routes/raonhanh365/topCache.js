var express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const topCache = require('../../controllers/raonhanh365/topCache');

router.post('/getTopCache',formData.parse(), topCache.getTopCache);

router.post('/supportSellNew',formData.parse(), topCache.supportSellNew);

router.post('/ward',formData.parse(), topCache.ward);

module.exports = router;