const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingProposechema = new Schema({

    // id bảng
    id: {
        type: Number,
        require: true
    },
    // id công ty
    comId: {
        type: Number
    },
    // id đề xuất
    dexuat_id: {
        type: Number
    },
    dexuat_name: {
        type: String
    },
    // Số cấp duyệt
    confirm_level: {
        type: Number,
        default: 0
    },
    // Hình thức duyệt : 1-lần lượt, 2-đồng thời, 3-cả 2
    confirm_type: {
        type: Number,
        default: 3
    },
    confirm_time: {
        type: Number,
        default: 0
    },
    created_time: {
        type: Number,
        default: Math.floor(Date.now() / 1000)
    },
    update_time: {
        type: Number,
        default: Math.floor(Date.now() / 1000)
    },

}, {
    collection: 'QLC_SettingPropose',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_SettingPropose', SettingProposechema)