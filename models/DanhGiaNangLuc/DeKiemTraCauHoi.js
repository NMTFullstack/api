const mongoose = require('mongoose');
const DeKiemTraCauHoi = new mongoose.Schema({
    id:{
        type: Number,
        require: true,
    }, 
    hinhthuc_taode:{
        type: Number,
        default: 0,
    }, // '1.Nguowif dungf tuwj tao,2.Heej thoosng tuwj taoj',
    kt_loai:{
        type: Number,
        default:0,
    }, // '2.tuluan, 1.Trắc nghiệm, 3.ca2',
    ch_thangdiem:{
        type: Number,
        default: null,
    },
    ten_de_kiemtra:{
        type: String,
        require: true,
    }, 
    nguoitao:{
        type: Number,
        default:null
    }, 
    ngaytao:{
        type: String,
        default: null
    }, 
    ghichu:{
        type: String,
        default:null
    }, 
    phanloai_macdinh:{
        type: String,
        default:null,
    }, 
    phanloaikhac:{
        type: String,
        default:null,
    }, 
    danhsach_cauhoi:{
        type: String,
        default:null,
    }, 
    id_congty:{
        type: Number,
        default:0,
    }, 
    congty_or_nv:{
        type: Number,
        default:0,
    }, 
    is_delete:{
        type: Number,
        default:1,
    }, 
    updated_at:{
        type: String,
        require:true
    }, 
}, {
    collection: 'DGNL_DeKiemTraCauHoi',
    
})
module.exports = mongoose.model("DGNL_DeKiemTraCauHoi", DeKiemTraCauHoi);