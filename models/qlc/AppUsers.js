const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QLC_AppUsers = new Schema({
    id: {// id bảng
        type: Number,
        required: true
    },
    ep_id: {//id nhân viên
        type: Number
    },
    app_id: [{//tên ứng dụng
        type: String,
    }],
    com_id: { //ID cty
        type: Number
    },
    update_time: {//thời gian cập nhật
        type: Number,
    },
    create_time: {//thời gian tạo
        type: Number,
    }
}, {
    collection: 'QLC_AppUsers',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model('QLC_AppUsers', QLC_AppUsers);