
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingIPApp = new mongoose.Schema({
    // id bảng
    id: {
        type: Number,
        require: true
    },
    // id công ty
    comId: {
        type: Number,
        require: true
    },
    // idQLC nhân viên
    ep_id: {
        type: Number,
        require: true
    },
    // danh sách IP
    ip: [
        {
            type: String,
            require: true
        }
    ],
    // danh sách ứng dụng
    app: [
        {
            type: Number,
            require: true
        }
    ],
    // ngày bắt đầu
    start_date: {
        type: Number,
        default: 0
    },
    // ngày kết thúc
    end_date: {
        type: Number,
        default: 0
    },
    created_time: {
        type: Number,
        default: 0
    },
    update_time: {
        type: Number,
        default: 0
    },
}, {
    collection: 'QLC_SettingIPApp',
    versionKey: false,
    timestamp: true
});
module.exports = mongoose.model('QLC_SettingIPApp', SettingIPApp)