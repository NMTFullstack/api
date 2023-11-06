var express = require('express');
var router = express.Router();

// Admin
var adminRouter = require('./timviec/admin');
var AdminCandidateRouter = require('./timviec/admin/candidate');
var AdminCompanyRouter = require('./timviec/admin/company');
var AccountRouter = require('./timviec/admin/account');
var AdminNewTV365Router = require('./timviec/admin/newTV365');
var AdminOrdersRouter = require('./timviec/admin/orders');

// 
var candidateRouter = require('./timviec/candidate');
var companyRouter = require('./timviec/company');
var cvRouter = require('./timviec/cv');
var appliRouter = require('./timviec/jobApplication');
var letterRouter = require('./timviec/letter');
var syllRouter = require('./timviec/syll');
// var newTV365Router = require('./timviec/newTV365/newTV365');
var newTV365Router = require('./timviec/newTV365');

var blogRouter = require('./timviec/blog');
var bodeRouter = require('./timviec/bo_de');
var bieumauRouter = require('./timviec/bm');
var priceListRouter = require('./timviec/priceList');
var trangVangRouter = require('./timviec/trangVang');
var permistionNotifyRouter = require('./timviec/permistionNotify');
var mail365Router = require('./timviec/mail365');
var sslRouter = require('./timviec/ssl');
var accountRouter = require('./timviec/account');
var companyVipRouter = require('./timviec/company_vip');
var creditsRouter = require('./timviec/credits');
var ordersRouter = require('./timviec/orders');
var tools = require('../controllers/tools/timviec365');
var checkSpamNewRouter = require('./timviec/checkSpamNew');
var historyRouter = require('./timviec/history');

// ADMIN
router.use('/admin', adminRouter);
router.use('/admin/uv', AdminCandidateRouter);
router.use('/admin/company', AdminCompanyRouter);
router.use('/admin/account', AccountRouter);
router.use('/admin/new', AdminNewTV365Router);
router.use('/admin/order', AdminOrdersRouter);

router.use('/candidate', candidateRouter);
router.use('/new', newTV365Router);
router.use('/company', companyRouter);
router.use('/blog', blogRouter);
router.use('/chpv', bodeRouter);
router.use('/cv', cvRouter);
router.use('/appli', appliRouter);
router.use('/letter', letterRouter);
router.use('/syll', syllRouter);
router.use('/mail365', mail365Router);
router.use('/bm', bieumauRouter);
router.use('/permission', permistionNotifyRouter);
router.use('/trangVang', trangVangRouter);
router.use('/priceList', priceListRouter);
router.use('/ssl', sslRouter);
router.use('/account', accountRouter);
router.use('/company/vip', companyVipRouter);
router.use('/credits', creditsRouter);
router.use('/order', ordersRouter);
router.get('/normalize/EPH', tools.normalizeExchangePointHistory);
router.get('/normalize/PL', tools.normalizePriceList);
router.use('/checkSpamNew', checkSpamNewRouter);
router.use('/history', historyRouter);
module.exports = router;