const mongoose = require('mongoose');
const TblChucVu = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    id_chucvu: {
        type: Number,
        required: true
    },
    ten_chucvu: {
        type: String,
        required: true
    },
    vitri_chucvu : {
        type: Number,
        required: true
    },
    creat_at: {
        type: Number,
        required: true
    },
    id_phongban : {
        type: Number,
        required: true
    },
    id_congty : {
        type: Number,
        required: true
    },
},
    {
        collection: "DGNL_TblChucVu",
        
    }

);

module.exports = mongoose.model("DGNL_TblChucVu", TblChucVu);
