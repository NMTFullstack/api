const mongoose = require('mongoose');
const TlbTieuChi = new mongoose.Schema({
    id : {
        type: Number,
        required: true
    },
    tcd_ten : {
        type: String,
        required: true
    },
    // '1.Tiêu chí đơn , 2.Tiêu chí tổng hợp'
    tcd_loai : {
        type: Number,
        required: true
    }, 
    // 'id tông hợp'
    tc_id_tonghop : {
        type: Number,
        default: null
    },
    // '1.Đóng 2.Mở'
    tcd_trangthai : {
        type: Number,
        required: true,
    },
    tcd_nguoitao : {
        type: Number,
        required: true
    },
    tcd_ngaytao : {
        type: Number,
        required: true
    },
    tcd_thangdiem : {
        type: Number,
        required: true
    },
    tcd_ghichu : {
        type: String
    },
    tcd_capnhat : {
        type : String,
        required : true,
        
    },
    id_congty : {
        type: Number,
        required: true
    },
    trangthai_xoa : { 
        type: Number,
        required: true,
        default : 1
    }

},{
    collection: "DGNL_TlbTieuChi",
   
}
);
module.exports = mongoose.model("DGNL_TlbTieuChi", TlbTieuChi);