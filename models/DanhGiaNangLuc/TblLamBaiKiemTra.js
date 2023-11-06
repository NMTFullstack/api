const mongoose = require('mongoose');
const TblLamBaiKiemTra = new mongoose.Schema({
    id: {
        type:Number,
        required: true
    },
    id_nv: {
        type:Number,
        required: true
    },
    phieu_id: {
        type:Number,
        required: true
    },
    cau_trl: {
        type:Number,
        required: true
    },
}, {
    collection: "DGNL_TblLamBaiKiemTra",
    
}
);
module.exports = mongoose.model("DGNL_TblLamBaiKiemTra", TblLamBaiKiemTra);