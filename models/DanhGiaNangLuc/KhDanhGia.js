const mongoose = require('mongoose');
const khDanhGia = new mongoose.Schema({
    
    kh_id:{
        type: Number,
        require: true,
    },  
    kh_ten:{
        type: String,
        require: true,
    },  
    kh_loai:{
        type: Number,
        require: true,
    },  // '1.Đề đánh giá, 2.Đề kiểm tra, 3.Cả hai',
    kh_nguoitao:{
        type: Number,
        require: true,
    },  
    kh_ngaytao:{
        type: Number,
        require: true,
    },  
    kh_trangthai:{
        type: Number,
        require: true,
        default:1,
    },  // '1.Chờ duyệt, 2.Đã duyệt, 3.Từ chối',
    kh_laplai:{
        type: Number,
        default:0
    },  // '1.Hàng ngày, 2.Hàng tuần, 3.Hàng tháng,4.Hàng năm',
    kh_thu:{
        type: Number,
        default:0
    }, 
    kh_ngaybatdau:{
        type: Number,
        require: true,
    },  
    kh_ngayketthuc:{
        type: Number,
        require: true,
    },  
    kh_giobatdau:{
        type: String,
        require: true,
    },  
    kh_gioketthuc:{
        type: String,
        require: true,
    },  
    kh_nguoiduyet:{
        type: Number,
        default:0
    },  
    kh_ngayduyet:{
        type: Number,
        default:0,
    }, 
    ten_tchoi:{
        type: Number,
        default:0
    }, 
    ngay_tchoi:{
        type: Number,
        default:0
    },  
    kh_tiendo:{
        type: Number,
        require: true,
        default:0
    },  
    kh_ghichu:{
        type: String,
        default:null
    },  
    kh_id_dg:{
        type: Number,
        default:0
    },  // 'id đề đánh giá và id đề kiểm tra',
    kh_id_kt:{
        type: Number,
        default:0
    },  
    kh_user_nv:{
        type: String,
        require: true,
    },  
    kh_user_pb:{
        type: String,
        default:null
    },  
    kh_user_dg:{
        type: String,
        require: true,
    },  
    kh_capnhat:{
        type: String,
        default:null
    },  
    id_congty:{
        type: Number,
        require: true,
    },  
    trangthai_xoa:{
        type: Number,
        require: true,
        default:1
    },  
}, {
    collection: 'DGNL_khDanhGia',
    
})
module.exports = mongoose.model("DGNL_khDanhGia", khDanhGia);