const router = require('express').Router();
const settingVanthu = require("../../controllers/vanthu/Setting/Setting")
var formData = require('express-form-data');
const functions = require('../../services/functions')

// Api lấy dữ liệu seting theo com_id nếu không có sẽ tạo mới
router.post('/createF', functions.checkToken, formData.parse(), settingVanthu.findOrCreateSettingDx);
// Api sửa setting
router.post('/editSetting', functions.checkToken, formData.parse(), settingVanthu.editSettingDx);
// Api lấy ra dữ liệu thời gian duyệt cho 24 đề xuất
router.post('/fetchTimeSetting', functions.checkToken, formData.parse(), settingVanthu.fetchTimeSetting);
// Api sửa thời gian duyệt
router.post('/updateTimeSetting', functions.checkToken, formData.parse(), settingVanthu.updateTimeSetting);
// Api làm mới thời gian duyệt
router.post('/resetTimeSetting', functions.checkToken, formData.parse(), settingVanthu.resetTimeSetting);

module.exports = router