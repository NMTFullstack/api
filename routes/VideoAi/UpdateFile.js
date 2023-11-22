const router = require("express").Router();
const formData = require("express-form-data");
const controller = require("../../controllers/VideoAi/UpdateVideo");
router.post("/getListBlogWork247", controller.getListBlogWork247);
router.post("/getListBlogTimViec", controller.getListBlogTimViec);
router.post("/listAllFilter", formData.parse(), controller.listAllFilter);
router.post("/deleteVideo", controller.deleteVideo);
router.post("/getTokenYoutube", controller.getTokenYoutube);
router.post("/updateVideo", controller.update, controller.updateVideo);
router.post("/editVideo", controller.editVideo);
router.post("/uploadYoutube", controller.uploadYoutube);
router.post("/uploadStore", controller.update, controller.uploadStore);
router.post("/updateTokenYoutube", controller.updateTokenYoutube);
module.exports = router;
