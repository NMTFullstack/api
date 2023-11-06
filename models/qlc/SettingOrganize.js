// Giới hạn IP cũ  - chuyển sang SettingIPNew

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingOrganize = new mongoose.Schema({
    id: { // id cấp tổ chức
        type: Number,
        require: true
    },
    comId: { // id công ty
        type: Number,
        require: true
    },
    parentId: { // id cấp trên
        type: Number,
        default: 0
    },
    organizeName: { // tên cấp
        type: String,
        require: true
    },
    level: {
        type: Number,
        require: true
    },
    created_time: {
        type: Number,
        default: 0
    },
    update_time: {
        type: Number,
        default: 0
    }
}, {
    collection: 'QLC_SettingOrganize',
    versionKey: false,
    timestamp: true
});
module.exports = mongoose.model('QLC_SettingOrganize', SettingOrganize)