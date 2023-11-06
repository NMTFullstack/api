const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingConfirmchema = new Schema({

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
    // Số cấp duyệt  === level của SettingConfirmLevel
    confirm_level: {
        type: Number,
        default: 3
    },
    // Hình thức duyệt : 1-lần lượt, 2-đồng thời, 3-cả 2
    confirm_type: {
        type: Number,
        default: 3
    },
    listPrivateLevel: [
        {
            dexuat_id: Number,
            confirm_level: Number,
            _id: false
        }
    ],
    listPrivateType: [
        {
            dexuat_id: Number,
            confirm_type: Number,
            _id: false
        }
    ],
    listPrivateTime: [
        {
            dexuat_id: Number,
            confirm_time: Number,
            _id: false
        }
    ],
    created_time: {
        type: Number,
        default: 0
    },
    update_time: {
        type: Number,
        default: 0
    },

}, {
    collection: 'QLC_SettingConfirm',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_SettingConfirm', SettingConfirmchema)