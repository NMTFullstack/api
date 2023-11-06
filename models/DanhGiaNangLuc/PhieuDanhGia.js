const mongoose = require('mongoose');
const PhieuDanhGia = new mongoose.Schema({
    id:{
        type: Number,
        require: true,
    }, 
    phieuct_id_kh:{
        type: Number,
        require: true,
    }, 
    phieu_ngay_bd:{
        type: Number,
        require: true,
    }, 
    phieu_ngay_kt:{
        type: Number,
        require: true,
    }, 
    phieuct_trangthai:{
        type: Number,
        require: true,
        default:1,
    }, // '1.Đang đánh giá 2.Hoàn thành',
    phieuct_diem_tc:{
        type: Number,
        default:null
    }, // 'list điểm',
    phieuct_tiendo_lambai:{
        type: Number,
        require: true,
    }, // 'làm dược bao nhiêu câu trên tổng số ',
    phieuct_chucnang:{
        type: Number,
        require: true,
        default: 1
    }, // '1:chưa chấm ,2 đã chấm ',
    phieuct_capnhat:{
        type: Date,
        default: Date.now,
        require: true,
    }, 
  phieu_ct_time_tao:{
        type: Number,
        require: true,
    }, 
  id_congty:{
        type: Number,
        require: true,
    }, 
  trangthai_xoa:{
        type: Number,
        require: true,
        default:1,
    }, 
  is_duyet:{
        type: Number,
        require: true,
        default:0
    }, 
}, {
    collection: 'DGNL_PhieuDanhGia',
    
})
module.exports = mongoose.model("DGNL_PhieuDanhGia", PhieuDanhGia);