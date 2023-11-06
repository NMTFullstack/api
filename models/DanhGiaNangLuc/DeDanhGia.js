const mongoose = require('mongoose');
const DeDanhGia = new mongoose.Schema({
    dg_id:{
        type: Number,
        require: true,
    },   
    dg_ten:{
        type: String,
        require: true,
    },   
    dg_nguoitao:{
        type: Number,
        require: true,
    },   
    dg_ngaytao:{
        type: Number,
        require: true,
    },  
    dg_thangdiem_id:{
        type: Number,
        require: true,
    },   
    dg_id_tieuchi:{
        type: String,
        require: true,
    },  
    dg_ghichu:{
        type: String,
        default:null
    },   
    dg_loai_macdinh:{
        type: String,
        require: true,
    },   // 'Llà phan loai mặc định'
    dg_phanloaikhac:{
        type: String,
        default:null,
    },   
    dg_capnhat:{
        type: String,
        
        require:true,
    },   
    id_congty:{
        type: Number,
        require: true,
    },  
    trangthai_xoa:{
        type: Number,
        default: 1,
        require: true
    },   
}, {
    collection: 'DGNL_DeDanhGia',
    
})
module.exports = mongoose.model("DGNL_DeDanhGia", DeDanhGia);