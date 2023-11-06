const mongoose = require('mongoose');
const TblCauTraLoi = new mongoose.Schema({
  id: {
    type: Number,
    required: true
    },
    ma_nv: {
        type: Number,
        required: true
    },
    cau_traloi: {
        type: String,
        required: true
    },
    trangthai_lam : {
        type: Number,
        // trạng thái   0 là đang làm , 1 là hoàn thành 
        required: true
    },
    id_congty : {
        type: Number,
        required: true
    },
    phieu_id : {
        type: Number,
        required: true
    },
} ,{
  collection: "DGNL_TblCauTraLoi",
  
} 
);
module.exports = mongoose.model("DGNL_TblCauTraLoi", TblCauTraLoi);