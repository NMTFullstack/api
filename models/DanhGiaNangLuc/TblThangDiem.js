const mongoose = require('mongoose');
const TblThangDiem = new mongoose.Schema({
    id : {
        type: Number,
        required: true
    },
    thangdiem : {
        type: Number,
        default: null
    },
    phanloai : {
        type: String,
        default:null
    },
    update_at : {
        type: Number,
        required: true
    },
    id_congty : {
        type: Number,
        required: true
    },

},{
    collection: "DGNL_TblThangDiem"
}
)
module.exports = new mongoose.model("DGNL_TblThangDiem", TblThangDiem);