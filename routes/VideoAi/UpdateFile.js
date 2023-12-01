const router = require("express").Router();
const formData = require("express-form-data");
const controller = require("../../controllers/VideoAi/UpdateVideo");
const tiktok = require("../../controllers/VideoAi/tiktok");
const tw = require("../../controllers/VideoAi/twitter");
const youtube = require("../../controllers/VideoAi/youtube");
const fb = require("../../controllers/VideoAi/facebook");
// main
router.post("/getListBlogWork247", controller.getListBlogWork247);
router.post("/getListBlogTimViec", controller.getListBlogTimViec);
router.post("/listAllFilter", formData.parse(), controller.listAllFilter);
router.post("/editVideo", controller.editVideo);
router.post("/deleteVideo", controller.deleteVideo);
router.post("/updateVideo", controller.update, controller.updateVideo);
router.post("/callAi", controller.callAi);

// youtube;
router.post("/getTokenYoutube", youtube.getTokenYoutube);
// router.post("/uploadYoutube", youtube.uploadYoutube);
// router.post("/uploadStore", youtube.update, controller.uploadStore);
router.post("/updateTokenYoutube", youtube.updateTokenYoutube);
router.post("/run", youtube.run);

// twitter
// router.post("/twitter_v2_self_owned", twitter.twitter_v2_self_owned);
router.post("/twitter_tweet", tw.twitter_tweet);

// tiktok
// router.post("/getTokenTikTok", tiktok.getTokenTikTok);

// facebook
router.post("/getTokenFacebook", fb.getTokenFacebook);
router.post("/postNewFacebook", fb.postNewFacebook);

module.exports = router;
