var express = require('express');
var router = express.Router();
const KetQuaDanhGiaPhongBan = require('../../controllers/DanhGiaNangLuc/KetQuaDG/KetQuaPhongBan');
const KetQuaDanhGiaCuaToi = require('../../controllers/DanhGiaNangLuc/KetQuaDG/KetQuaCuaToi');
const formData = require("express-form-data")
const functions = require('../../services/functions')




router.post('/allPhongBan', formData.parse(), functions.checkToken, KetQuaDanhGiaCuaToi.allPhongBan);
router.post('/allKhdg', formData.parse(), functions.checkToken, KetQuaDanhGiaCuaToi.allKhdg);
router.post('/allusers', formData.parse(), functions.checkToken, KetQuaDanhGiaCuaToi.allusers);
router.post('/KetQuaDanhGiaCuaToi', formData.parse(), functions.checkToken, KetQuaDanhGiaCuaToi.KetQuaDanhGiaCuaToi);


router.post('/KetQuaPhongBan', formData.parse(), functions.checkToken, KetQuaDanhGiaPhongBan.KetQuaPhongBan);
router.post('/allKHDG', formData.parse(), functions.checkToken, KetQuaDanhGiaPhongBan.allKHDG);
router.post('/allPb', formData.parse(), functions.checkToken, KetQuaDanhGiaPhongBan.allPb);



module.exports = router;