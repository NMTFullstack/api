const mongoose = require("mongoose");
const PhieuDanhGiaChiTiet= new mongoose.Schema({
    id: {
        type: Number,
        required: true
      },
      id_doituong: {
        type: Number,
        default: null
      },
      doituong_loai: {
        type: Number,
        required: true
      },
      id_nguoidanhgia: {
        type: Number,
        required: true
      },
      phieu_id: {
        type: Number,
        required: true
      },
      cd_diem: {
        type: String,
        required: true
      },
      cd_diem_ktra: {
        type: String,
        required: true
      },
      nhanxet: {
        type: String,
        required: true
      },
      nhanxet_kt: {
        type: String,
        required: true
      },
      tongdiem: {
        type: Number,
        required: true
      },
      tongdiem_kt: {
        type: Number,
        required: true
      },
      phieuct_trangthai: {
        type: Number,
        default: 1
      },
      phieuct_trangthai_kt: {
        type: Number,
        default: 1
      },
      cd_capnhat: {
        type: String,
        required: true
      
      },
      id_congty: {
        type: Number,
        required: true
      },
      trangthai_xoa: {
        type: Number,
        default: 1
      },
      is_duyet: {
        type: Number,
        default: 0
      },
    }, {
    collection: "DGNL_PhieuDanhGiaChiTiet",
    versionKey: false,
}
);
module.exports = mongoose.model("DGNL_PhieuDanhGiaChiTiet", PhieuDanhGiaChiTiet);


