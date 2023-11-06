const mongoose = require('mongoose');
const DeKiemTra = new mongoose.Schema({
    kt_id:{
        type: Number,
        require: true,
    },  
    kt_ten:{
        type: String,
        require: true,
    },  
    kt_nguoitao:{
        type: Number,
        require: true,
    },  
    kt_ngaytao:{
        type: Number,
        require: true,
    },  
    kt_thangdiem:{
        type: Number,
        require: true,
    },  
    kt_ghichu:{
        type: String,
        default:null
    }, 
    kt_phanloai_macdinh:{
        type: String,
        default:null
    },  
    kt_phanloai_khac:{
        type: String,
        default:null
    },  
    kt_capnhat:{
        type: Date,
        default: Date.now,
        require:true,
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
    mang_cauhoi:{
        type: String,
        require: true,
    },  
}, {
    collection: 'DGNL_DeKiemTra',
    
})
module.exports = mongoose.model("DGNL_DeKiemTra", DeKiemTra);