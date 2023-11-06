const mongoose = require('mongoose');
const LoaiCauHoi = new mongoose.Schema({
    
    id:{
        type: Number,
        require: true,
    },  
    ten_loai:{
        type: String,
        default:null
    }, 
    nguoitao:{
        type: Number,
        default:0
    },  
    id_congty:{
        type: Number,
        default:0
    },  
    created_at:{
        type: Number,
        default:0
    },  
    updated_at:{
        type: Number,
        default:0
    },  
    trangthai_xoa:{
        type: Number,
        require: true,
        default:1
    },  
    ghichu: {
        type: String,
        default:null
    }, 
}, {
    collection: 'DGNL_LoaiCauHoi',
    
})
module.exports = mongoose.model("DGNL_LoaiCauHoi", LoaiCauHoi);