// hồ sơ
const mongoose = require('mongoose');
const Tv365ProfileSchema = new mongoose.Schema({
    hs_id: {
        type: Number,
        require: true,
        unique: true,
        autoIncrement: true
    },
    hs_use_id: {
        type: Number,
        require: true,
    },
    hs_name: {
        // Tên của file được lưu lại
        type: String,
        default: null
    },
    hs_link: {
        // Đường dẫn cv không che thông tin
        type: String,
        default: null
    },
    hs_cvid: {
        // Đường dẫn cv và đường dẫn cv che thông tin email,sđt khi tạo cv
        type: Number,
        default: 0
    },
    hs_create_time: {
        type: Number,
        default: 0
    },
    hs_active: {
        type: Number,
        default: 0
    },
    hs_link_hide: {
        type: String,
        default: null
    },
    is_scan: {
        type: Number,
        default: 0
    },
    hs_link_error: {
        type: String,
        default: null
    },
    state: {
        type: Number,
        default: 0
    },
    mdtd_state: {
        type: Number,
        default: 0
    },
    scan_cv: {
        type: Number,
        default: 0
    }
}, {
    collection: 'Tv365Profile',
    versionKey: false
});

module.exports = mongoose.model("Tv365Profile", Tv365ProfileSchema);