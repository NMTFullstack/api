const mongoose  = require('mongoose');
const TblPhanQuyen = new mongoose.Schema({
    id_phanquyen : {
        type: Number,
        require: true
    },
    // user nhân viên
    id_user : {
        type: Number,
        require: true
    },
    id_cty : {
        type: Number,
        require: true
    },
    tieuchi_dg : {
        type: String,
        require: true
    },
    de_kiemtra : {
        type: String,
        require: true
    },
    kehoach_dg : {
        type: String,
        require: true
    },
    ketqua_dg : {
        type: String,
        require: true
    },
    lotrinh_thangtien : {
        type: String,
        require: true
    },
    phieu_dg : {
        type: String,
        require: true
    },
    phanquyen : {
        type: String,
        require: true 
    },
    thangdiem : {
        type: String,
        require: true 
    },

}, {
    collection : "DGNL_TblPhanQuyen",
    
}
)
module.exports = mongoose.model("DGNL_TblPhanQuyen", TblPhanQuyen);