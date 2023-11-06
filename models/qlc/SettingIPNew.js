// giới hạn IP mới - đang dùng
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SetIPShema = new mongoose.Schema({
    id_acc: { // id cài đặt ip
        type: Number,
        require: true
    },
    id_com: { // id công ty
        type: Number,
    },
    ip_access: [{ //địa chỉ ip
        type: String,
    }],
    dep_id: [{  // danh sách ID phòng ban
        type: Number,
    }],
    team_id: [{ // danh sách ID của tổ
        type: Number,
    }],
    gr_id: [{ // danh sách ID của nhóm
        type: Number,
    }],
    user_id: [{ // danh sách id nhan vien
        type: Number,
    }],
    from_site: { // site cài IP 
        type: String,
        default: ''
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
    collection: 'QLC_AccessIPNew',
    versionKey: false,
    timestamp: true
});
module.exports = mongoose.model('QLC_AccessIPNew', SetIPShema)