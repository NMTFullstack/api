var express = require('express');
var router = express.Router();
var admin = require('../../controllers/raonhanh365/admin');
var formData = require('express-form-data');
const functions = require('../../services/functions');
const serviceRN = require('../../services/raoNhanh365/service');
var news = require('../../controllers/raonhanh365/new');
var blog = require('../../controllers/raonhanh365/blog');

//---------api lien quan sau khi admin dang nhap
router.post('/loginAdmin', formData.parse(), admin.loginAdminUser);
router.post('/changePasswordAdminLogin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365], admin.changePasswordAdminLogin);
router.post('/changeInfoAdminLogin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365], admin.changeInfoAdminLogin);
router.post('/getSideBar', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365], admin.getSideBar);
router.post('/listModule', formData.parse(), functions.checkToken, admin.listModule);
router.post('/updateActiveAdmin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365], admin.updateActiveAdmin)

//------------------------------------------------api quan ly tai khoan(admin)
router.post('/account/getListAdmin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(27, 1)], admin.getListAdminUser);
router.post('/account/createAdmin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(27, 2)], admin.createAdminUser);
router.post('/account/updateAdmin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(27, 3)], admin.updateAdminUser);
router.post('/account/changePassword', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(27, 3)], admin.changePassword);

//------------------------------------------------api quan ly danh muc
router.post('/getListCategory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(15, 1)], admin.getListCategory);
router.post('/createCategory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(15, 2)], admin.getAndCheckDataCategory, admin.createCategory);
router.post('/updateCategory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(15, 3)], admin.getAndCheckDataCategory, admin.updateCategory);
router.post('/activeAndShowCategory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(15, 3)], admin.activeAndShowCategory);
router.post('/deleteManyCategory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(15, 4)], admin.deleteManyByModule);

//------------------------------------------------api tin rao vat
router.post('/getListSellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 1)], admin.getListNews);
router.post('/updateSellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 3)], admin.getAndCheckDataNews, admin.updateNews);
router.post('/pinSellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 3)], admin.pinNews);
router.post('/pushSellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 3)], admin.pushNews);
router.post('/activeSellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 3)], admin.activeNews);
router.post('/deleteManySellNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(14, 4)], admin.deleteManyByModule);

//------------------------------------------------api tin dang mua
router.post('/getListBuyNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(30, 1)], admin.getListNews);
router.post('/updateBuyNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(30, 3)], admin.getAndCheckDataNews, admin.updateNews);
router.post('/activeBuyNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(30, 3)], admin.activeNews);
router.post('/deleteManyBuyNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(30, 4)], admin.deleteManyByModule);

//------------------------------------------------api giá ghim tin đăng and giá đẩy tin đăng
router.post('/getListPrice', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(22, 1)], admin.getListPrice);
router.post('/createPriceListPin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(22, 2)], admin.createAndUpdatePriceListPin);
router.post('/updatePriceListPin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(22, 3)], admin.createAndUpdatePriceListPin);
router.post('/deleteManyPriceListPin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(22, 4)], admin.deleteManyByModule);

//------------------------------------------------api quan ly tai khoan(tk ca nhan)
router.post('/getListUserIndividual', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(23, 1)], admin.getListUser);
router.post('/updateUserIndividual', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(23, 3)], admin.updateUser);
router.post('/deleteManyUserIndividual', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(23, 4)], admin.deleteManyByModule);

//------------------------------------------------api blog
router.post('/getListBlog', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(25, 1)], admin.getListBlog);
router.post('/createBlog', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(25, 2)], admin.getAndCheckDataBlog, admin.createBlog);
router.post('/updateBlog', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(25, 3)], admin.getAndCheckDataBlog, admin.updateBlog);
router.post('/activeBlog', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(25, 3)], admin.activeBlog);
router.post('/deleteManyBlog', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(25, 4)], admin.deleteManyByModule);

//------------------------------------------------api lich su nap the---------------------------------------------------
router.post('/getListHistory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(24, 1)], admin.getListHistory);
router.post('/deleteManyHistory', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(24, 4)], admin.deleteManyByModule);

//------------------------------------------------api tai khoan gian hang(tk doanh nghiep)
router.post('/getListUserCompany', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(26, 1)], admin.getListUser);
router.post('/updateUserCompany', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(26, 3)], admin.updateUser);
router.post('/deleteManyUserCompany', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(26, 4)], admin.deleteManyByModule);

//-----------------------------------------------Tin tuyen dung
router.post('/getListRecruitmentNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(28, 1)], admin.getListNews);
router.post('/deleteManyRecruitmentNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(28, 4)], admin.deleteManyByModule);

//-----------------------------------------------Tin tim viec
router.post('/getListFindJobNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(29, 1)], admin.getListNews);
router.post('/deleteManyFindJobNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(29, 4)], admin.deleteManyByModule);

//-----------------------------------------------tin spam
router.post('/getListNewsSpam', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(40, 1)], admin.getListNewsSpam);
router.post('/activeNewsSpam', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(40, 3)], admin.activeNewsSpam);
router.post('/deleteManyNewsSpam', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(40, 4)], admin.deleteManyByModule);

//-----------------------------------------------Danh sach anh trung
router.post('/danhSachAnhTrung', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(42, 1)], admin.danhSachAnhTrung);
router.post('/activeAnhTrung', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(42, 3)], admin.activeAnhTrung);
router.post('/deleteManyAnhTrung', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(42, 4)], admin.deleteManyByModule);

//------------------------------------------------duyet tin
router.post('/danhSachTinCanDuyet', formData.parse(), formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(43, 1)], admin.danhSachTinCanDuyet);
router.post('/duyetTin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(43, 3)], admin.duyetTin);
router.post('/deleteManyDuyetTin', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(43, 4)], admin.deleteManyByModule);

//------------------------------------------------api báo cáo tin
router.post('/listReportNew', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(31, 1)], admin.listReportNew);
router.post('/xuLyBaoCao', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(31, 3)], admin.xuLyBaoCao);
router.post('/deleteManyReportNew', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(31, 4)], admin.deleteManyByModule);

//------------------------------------------------api giá ghim tin đăng and giá đẩy tin đăng
router.post('/getListPricePinNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(32, 1)], admin.getListPrice);
router.post('/createPriceListPinNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(32, 2)], admin.createAndUpdatePriceListPin);
router.post('/updatePriceListPinNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(32, 3)], admin.createAndUpdatePriceListPin);
router.post('/deleteManyPriceListPinNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(32, 4)], admin.deleteManyByModule);

//------------------------------------------------api giá đẩy tin đăng
router.post('/getListPricePushNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(33, 1)], admin.getListPrice);
router.post('/updatePriceListPushNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(33, 3)], admin.updatePriceListPush);
router.post('/deleteManyPriceListPushNews', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(33, 4)], admin.deleteManyByModule);

//------------------------------------------------api chiết khấu nạp thẻ
router.post('/getListDiscountCard', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(39, 1)], admin.getListDiscountCard);
router.post('/updateDiscountCard', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(39, 2)], admin.updateDiscountCard);
router.post('/deleteManyDiscountCard', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(39, 4)], admin.deleteManyByModule);

//------------------------------------------------api xac thuc thanh toan dam bao
router.post('/getUserVerifyPayment', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(35, 1)], admin.getListUserVerifyPayment);
router.post('/verifyPayment', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(35, 3)], admin.adminVerifyPayment);
router.post('/deleteManyVerifyPayment', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(35, 4)], admin.deleteManyByModule);

//-----------------------------------------------api nguoi mua xac nhan thanh toan
router.post('/getListOrderPayment', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(34, 1)], admin.getListOrderPayment);
router.post('/verifyOrder', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(34, 3)], admin.adminVerifyOrder);
router.post('/deleteManyVerifyOrder', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(34, 4)], admin.deleteManyByModule);

//----------------------------------------------api tags index
router.post('/tagsIndex', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(36, 1)], admin.getListTagsIndex);
router.post('/deleteManyTagsIndex', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(36, 4)], admin.deleteManyByModule);

//------------------------------------------------api danh sách lỗi đăng ki
router.post('/failRegisterUser', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(38, 1)], admin.failRegisterUser);
router.post('/deleteManyFailRegister', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365, serviceRN.checkRight(38, 4)], admin.deleteManyByModule);

router.post('/deleteManyByModule', formData.parse(), [functions.checkToken, serviceRN.isAdminRN365], admin.deleteManyByModule);

module.exports = router;