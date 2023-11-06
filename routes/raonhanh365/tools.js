var express = require('express');
var router = express.Router();
const formData = require('express-form-data');
const toolRaoNhanh = require('../../controllers/tools/raonhanh365');

router.post('/raonhanh/toolAdminUserRight', formData.parse(), toolRaoNhanh.toolAdminUserRight);
router.post('/raonhanh/toolAdminMenuOrder', formData.parse(), toolRaoNhanh.toolAdminMenuOrder);
router.post('/raonhanh/toolModule', formData.parse(), toolRaoNhanh.toolModule);
router.post('/raonhanh/toolCateDetail', formData.parse(), toolRaoNhanh.toolCateDetail);
router.post('/raonhanh/toolNewRN', formData.parse(), toolRaoNhanh.toolNewRN);
router.post('/raonhanh/toolCategory', formData.parse(), toolRaoNhanh.toolCategory);
router.post('/raonhanh/updateInfoSell', formData.parse(), toolRaoNhanh.updateInfoSell);
router.post('/raonhanh/toolPriceList', formData.parse(), toolRaoNhanh.toolPriceList);
router.post('/raonhanh/toolCity', formData.parse(), toolRaoNhanh.toolCity);
router.post('/raonhanh/toolLike', formData.parse(), toolRaoNhanh.toolLike);
router.post('/raonhanh/toolHistory', formData.parse(), toolRaoNhanh.toolHistory);
router.post('/raonhanh/toolBidding', formData.parse(), toolRaoNhanh.toolBidding)
router.post('/raonhanh/toolApplyNew', formData.parse(), toolRaoNhanh.toolApplyNew);
router.post('/raonhanh/toolComment', formData.parse(), toolRaoNhanh.toolComment);
router.post('/raonhanh/toolOrder', formData.parse(), toolRaoNhanh.toolOrder);
router.post('/raonhanh/toolTagsIndex', formData.parse(), toolRaoNhanh.toolTagsIndex);
router.post('/raonhanh/updateNewDescription', formData.parse(), toolRaoNhanh.updateNewDescription);
router.post('/raonhanh/toolEvaluate', formData.parse(), toolRaoNhanh.toolEvaluate);
router.post('/raonhanh/toolCart', formData.parse(), toolRaoNhanh.toolCart);
router.post('/raonhanh/toolTags', formData.parse(), toolRaoNhanh.toolTags);
router.post('/raonhanh/toolContact', formData.parse(), toolRaoNhanh.toolContact);
router.post('/raonhanh/toolRegisterFail', formData.parse(), toolRaoNhanh.toolRegisterFail);
router.post('/raonhanh/toolSearch', formData.parse(), toolRaoNhanh.toolSearch);
router.post('/raonhanh/toolTblTags', formData.parse(), toolRaoNhanh.toolTblTags);
router.post('/raonhanh/toolPushNewsTime', formData.parse(), toolRaoNhanh.toolPushNewsTime);
router.post('/raonhanh/toolAdminUser', formData.parse(), toolRaoNhanh.toolAdminUser);
router.post('/raonhanh/toolAdminTranslate', formData.parse(), toolRaoNhanh.toolAdminTranslate);
router.post('/raonhanh/toolBlog', formData.parse(), toolRaoNhanh.toolBlog)
router.post('/raonhanh/toolLoveNew', formData.parse(), toolRaoNhanh.toolLoveNew)
router.post('/raonhanh/toolCateVl', formData.parse(), toolRaoNhanh.toolCateVl)
router.post('/raonhanh/toolkeyword', formData.parse(), toolRaoNhanh.toolkeyword)
router.post('/raonhanh/imageDeplicate', formData.parse(), toolRaoNhanh.imageDeplicate);
router.post('/raonhanh/baoCao', formData.parse(), toolRaoNhanh.baoCao);
router.post('/raonhanh/idRaoNhanh365', formData.parse(), toolRaoNhanh.idRaoNhanh365);

// router.post('/raonhanh/toolPhuongXa', formData.parse(), toolRaoNhanh.toolPhuongXa)
router.post('/raonhanh/toolbanggiacknt', formData.parse(), toolRaoNhanh.toolbanggiacknt)

module.exports = router;