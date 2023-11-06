const mongoose = require('mongoose');
const Vanthu_time_setting_dx = new mongoose.Schema({
    _id: {
        type: Number,
        required: true
    },
    id_dx: {
        type: Number,
        required: true
    },
    name_cate_dx: {
        type: String,
        required: true
    },
    time: {
        type: Number,
        default: 0,
    },
    com_id: {
        type: Number,
        required: true
    },
    created_time: {
        type: Number,
        default: new Date().getTime() / 1000,
    }
})
module.exports = mongoose.model('Vanthu_time_setting_dx', Vanthu_time_setting_dx);