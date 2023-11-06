var express = require('express');
var router = express.Router();

var PhieuDanhGia = require('./DGNL/PhieuDanhGia');
var LoTrinhThangTien = require('./DGNL/LoTrinhThangTien');
var KetQuaDanhGia = require('./DGNL/KetQuaDanhGia');
var PhanQuyen = require('./DGNL/PhanQuyen');
const DeDanhGiaNL = require('./DGNL/DeDanhGiaNL/DeDanhGiaNL');
const DSTieuChi = require('./DGNL/DeDanhGiaNL/DSTieuChi');
const TrangChu = require('./DGNL/TrangChu')
const LoaiCauHoi = require('./DGNL/DeKTraNL/LoaiCauHoi')
const DanhSachCauHoi = require('./DGNL/DeKTraNL/DanhSachCH')
const DeKiemTraNangLuc = require('./DGNL/DeKTraNL/DeKiemTraNangLuc')
const KhDanhGia = require('./DGNL/KhDanhGia')
const KetQuaNv = require('./DGNL/KetQuaDG/KetQuaNv')
const KetQuaPhongBan = require('./DGNL/KetQuaDG/KetQuaPhongBan')
const CaiDat = require('./DGNL/CaiDat')
const TieuChiDeDG = require('./DGNL/Dulieuxoaganday/TieuChiDeDG')
const KehoachDG = require('./DGNL/Dulieuxoaganday/KehoachDG')
const PhieuDG = require('./DGNL/Dulieuxoaganday/PhieuDG')
const DeKt = require('./DGNL/Dulieuxoaganday/DeKt')
const functions = require('../services/functions')
const ToolCheck = require('./DGNL/ToolCheck')


router.use('/ToolCheck', ToolCheck)
router.use('/DeDGNL', DeDanhGiaNL);
router.use('/DSTieuChi', DSTieuChi);
router.use('/TrangChu', TrangChu);
router.use('/TypeOfQues', LoaiCauHoi)
router.use('/ListQues', DanhSachCauHoi)
router.use('/ExamQues', DeKiemTraNangLuc)
router.use('/KhDanhGia', KhDanhGia)
router.use('/KetQuaNv', KetQuaNv)
router.use('/KetQuaPhongBan', KetQuaPhongBan)
router.use('/CaiDat', CaiDat)
router.use('/TieuChiDeDG', TieuChiDeDG)
router.use('/KehoachDG', KehoachDG)
router.use('/PhieuDG', PhieuDG)
router.use('/DeKt', DeKt)
router.use('/PhieuDanhGia', PhieuDanhGia);
router.use('/LoTrinhThangTien', LoTrinhThangTien);
router.use('/KetQuaDanhGia', KetQuaDanhGia);
router.use('/PhanQuyen', PhanQuyen);

module.exports = router