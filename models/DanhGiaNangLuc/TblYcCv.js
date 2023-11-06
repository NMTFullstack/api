const mongoose = require('mongoose');
const TblYcCv = new mongoose.Schema({
    id : {
        type: Number,
        required: true
    },
    id_chucvu : {
        type: Number,
        required: true
    },
    ten_yeucau : {
        type: String,
        required: true
    },
    id_pb : {
        type: Number,
        required: true
    },
    mota_yeucau : {
        type: String,
        required: true
    },
    id_congty : {
        type: Number,
        required: true
    }
},{
    collection: "DGNL_TblYcCv",
    
});

module.exports = mongoose.model('DGNL_TblYcCv', TblYcCv);