const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const notify_app = new Schema({
    //ID chính nhận thông báo
    user_id: {
        type: Number,
        default: 0
    },
    //ID bị ảnh hưởng, ID nguồn tạo ra thông báo
    affected_id: {
        type: Number,
        default: 0
    },
    // Nội dung thông báo
    not_image: {
        type: String,
        default: 0
    },
    // 	Nội dung thông báo
    not_desc: {
        type: String,
        default: 0
    },
    user_type: {
        type: String,
        require: true
    },
    //Loại thông báo. 1 là thông báo từ hệ thống, 2 là thông báo giữa các người dùng với nhau
    not_type: {
        type: String,
        default: 0
    },
    time_create: {
        type: Date,
        require: true
    },
    not_active: {
        type: Date,
        require: true
    },
    is_seen: {
        type: Date,
        require: true
    },
    url_notification: {
        type: String,
        require: true
    }
})


module.exports = mongoose.model('QLC_Notify_App', notify_app)