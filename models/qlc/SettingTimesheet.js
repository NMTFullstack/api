const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SettingTimeSheet = new Schema({
    setting_id: {
        type: Number,
        unique: true
    },
    setting_name: {
        type: String
    },
    com_id: {
        type: Number
    },
    list_org: [
        { type: Number }
    ],
    list_pos: [
        { type: Number }
    ],
    list_emps: [
        { type: Number }
    ],
    list_shifts: [{
        type: {
            id: Number, // id ca
            type_shift: Number // loai ca : 1 vao,
        }
    }],
    list_wifi: [
        { type: Number }
    ],
    list_loc: [
        { type: Number }
    ],
    list_ip: [
        { type: Number }
    ],
    list_device: [
        { type: String }
    ],
    start_time: {
        type: Date,
    },
    end_time: {
        type: Date,
    },
    create_time: {
        type: Date,
        default: Date.now
    },


}, {
    collection: 'QLC_SettingTimesheet',
    versionKey: false
})

module.exports = mongoose.model("QLC_SettingTimesheet", SettingTimeSheet);