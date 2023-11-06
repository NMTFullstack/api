const router = require('express').Router();
const EmotionController = require('../../controllers/qlc/EmotionSettings')
const functions = require("../../services/functions")
const formData = require('express-form-data')

//API lấy tất cả dữ liệu 
router.post("/list", formData.parse(), functions.checkTokenV2, EmotionController.getEmotionSettings);

router.post("/create", formData.parse(), functions.checkTokenV2, EmotionController.createNewEmotion);

router.post("/update", formData.parse(), functions.checkTokenV2, EmotionController.updateNewEmotion);

router.post("/delete", formData.parse(), functions.checkTokenV2, EmotionController.deleteEmotion);
router.post("/updateMinScore", formData.parse(), functions.checkTokenV2, EmotionController.updateMinScore);

router.post("/toggleOnOff", formData.parse(), functions.checkTokenV2, EmotionController.toggleOnOffEmotion);

router.post("/getToggleEmotion", formData.parse(), functions.checkTokenV2, EmotionController.getInfoToggleEmotion);

module.exports = router