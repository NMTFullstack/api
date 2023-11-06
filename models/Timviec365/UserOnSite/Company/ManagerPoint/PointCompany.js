const mongoose = require('mongoose');
const Tv365PointCompanySchema = new mongoose.Schema({
    usc_id: {
        type: Number,
        required: true,
    },
    point: {
        type: Number,
        default: 0,
    },
    point_usc: {
        type: Number,
        default: 0,
    },
    money_usc: {
        type: Number,
        default: 0,
    },
    point_bao_luu: {
        type: Number,
        default: 0,
    },
    chu_thich_bao_luu: {
        type: String,
        default: null,
    },
    day_reset_point: {
        type: Number,
        default: 0,
    },
    ngay_reset_diem_ve_0: {
        type: Number,
        default: 0,
    },
}, {
    collection: 'Tv365PointCompany',
    versionKey: false,
    timestamp: true
});
module.exports = mongoose.model("Tv365PointCompany", Tv365PointCompanySchema);