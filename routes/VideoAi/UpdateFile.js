const router = require("express").Router();
const formData = require("express-form-data");
const controller = require("../../controllers/VideoAi/UpdateVideo");
// const multer = require("multer");
// const upload = multer({ storage });
router.post("/getListBlogAll", formData.parse(), controller.getListBlogAll);
router.post("/updateVideo", controller.update, controller.handeUpdate);
module.exports = router;
