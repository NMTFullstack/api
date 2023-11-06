const mongoose = require('mongoose');

const PersonalIPShema = new mongoose.Schema({
    person_access_id: { // id cài đặt cá nhân
        type: Number,
        require: true,
        unique: true,
    },
    user_id: { // id user (idQLC)
        type: Number,
        require: true
    },
    com_id: { // id công ty
        type: Number,
        require: true
    },
    shift_id: { // id ca làm việc
        type: Number,
        require: true
    },
    wifi_access: {
        type: {
            arr_wifi_name: String,
        }
    },
    loc_access: [{
        type: {
            vi_tri: String,
            name: String,
        }
    }],
    ip_access: {
        type: {
            arr_ip: String,
        }
    },
    time_start: {
        type: Date,
        default: new Date()
    },
    time_end: {
        type: Date,
        default: new Date()
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
    collection: 'QLC_PersonalAccessIP',
    versionKey: false,
    timestamp: true
});
module.exports = mongoose.model('QLC_PersonalAccessIP', PersonalIPShema)