const mongoose = require('mongoose');
const DanhSachCauHoi = new mongoose.Schema({
    id:{
        type: Number,
        require: true,
    },  
    cauhoi:{
        type: String,
        default: null
    }, 
    hinhthuc:{
        type: Number,
        default: 0
    }, // 1tu luan 2 trac nghiem
    loai:{
        type: Number,
        default: 0
    }, 
    sodiem:{
        type: String,
        default: 0
    }, 
    thoigian_thuchien:{
        type: Number,
        default: 0
    }, 
    dap_an:{
        type: String,
        default: null
    }, 
    created_at:{
        type: Number,
        default: 0
    }, 
    updated_at:{
        type: Number,
        default: null
    }, 
    nguoi_capnhat:{
        type: Number,
        default: 0
    }, 
    id_congty:{
        type: Number,
        default: 0
    }, 
    trangthai_xoa:{
        type: Number,
        default: 1
    }, 
    img_cauhoi:{
        type: Array,
        default: []
    }, 
    congty_or_nv:{
        type: Number,
        default: 0
    }, 
}, {
    collection: 'DGNL_DanhSachCauHoi',
    
})
module.exports = mongoose.model("DGNL_DanhSachCauHoi", DanhSachCauHoi);