const router = require('express').Router()
const formData = require('express-form-data')
const CallAI = require('../../controllers/qlc/CallAI')
const functions = require('../../services/functions')
const multer = require('multer')
const upload = multer()

//cap nhat khuon mat
router.post(
  '/detectFace',
  formData.parse({ maxFilesSize: 55000 }),
  CallAI.DetectFace
)
router.post('/updateFace', formData.parse(), CallAI.UpdateFace)
router.post('/updateFaceNew', formData.parse(), CallAI.UpdateFace2)
router.post('/detectFakeFace', formData.parse(), CallAI.detectFake)
router.post(
  '/tts',
  formData.parse(),
  functions.checkToken,
  CallAI.textToSpeechGoogle
)

router.post('/DataThongKeGiaLap', formData.parse(), CallAI.DataThongKeGiaLap)
router.post('/DiaChiMay', formData.parse(), CallAI.DiaChiMay)

router.post(
  '/updateFace3d',
  functions.checkToken,
  formData.parse(),
  CallAI.UpdateFace3d
)
// router.post('/saveCheckinImg', formData.parse(), functions.checkToken, CallAI.saveImgCheckin)
module.exports = router
