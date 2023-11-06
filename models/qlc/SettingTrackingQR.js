const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SettingTrackingQR = new Schema({
    id: {
        type: Number,
        unique: true
    },
    com_id: {
        type: Number
    },
    name: {
        type: String
    },
    // danh sách tổ chức
    list_org: [
        { type: Number }
    ],
    list_pos: [
        { type: Number }
    ],
    list_shifts: [
        { type: Number }
    ],
    listUsers: [{
        type: Number
    }],
    // danh sách IP cho phép
    list_ip: [
        { type: Number }
    ],
    //  1:CameraAI365
    //  2:Appchat365
    //  3:QRChat365
    list_device: [
        { type: Number }
    ],
    location_id: {
        type: Number
    },
    QRCode_id: {
        type: Number
    },
    start_time: {
        type: Date,
        default: null
    },
    end_time: {
        type: Date,
        default: null
    },
    created_time: {
        type: Date,
        default: Date.now
    },
    update_time: {
        type: Date,
        default: Date.now
    }


}, {
    collection: 'QLC_SettingTrackingQR',
    versionKey: false
})

module.exports = mongoose.model("QLC_SettingTrackingQR", SettingTrackingQR);