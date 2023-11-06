const router = require('express').Router();
const controller = require('../../../controllers/DanhGiaNangLuc/DSTieuChi/DSTieuChi');

var formData = require('express-form-data');
const functions = require('../../../services/functions')


router.post('/NameAndStationTC', functions.checkToken, formData.parse(), controller.SearchTieuChi)
router.post('/addTC', functions.checkToken, formData.parse(), controller.ThemMoiTC)
router.get('/ChiTietTC/:id', formData.parse(), controller.ChiTietTC)

// thay doi trang thai
router.patch('/changeStation', formData.parse(), controller.ChangeStation)
router.patch('/deleteStation', functions.checkToken, formData.parse(), controller.XoaTC)
    // chinh sua tieu chi
router.patch('/ChinhSuaTc', functions.checkToken, formData.parse(), controller.ChinhSua)
router.get('/searchTC', functions.checkToken, formData.parse(), controller.searchTC)
router.post('/listTC', functions.checkToken, formData.parse(), controller.listTC)

// ...
router.post('/searchTCD', functions.checkToken, formData.parse(), controller.searchTCD)

// lay tieu chi don
router.post('/layTcd', functions.checkToken, formData.parse(), controller.LayTcd)
    // lay tieu chi 
router.get('/detailAndUpdate/:id', functions.checkToken, controller.detailAndUpdateTC)


module.exports = router