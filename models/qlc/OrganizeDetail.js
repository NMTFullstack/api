

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrganizeDetail = new mongoose.Schema({
    id: { // id cấp tổ chức chi tiết
        type: Number,
        require: true
    },
    comId: { // id công ty
        type: Number,
        require: true
    },
    // trưởng tổ chức (id users)
    // managerId: {
    //     type: Number,
    //     require: true,
    //     default: 0
    // },
    // phó tổ chức (id users)
    // deputyId: {
    //     type: Number,
    //     require: true,
    //     default: 0
    // },
    // settingOrganizeId: { // id tổ chức - liên kết khóa ngoại
    //     type: Number,
    //     require: true
    // },
    parentId: { // id cha
        type: Number,
        require: true
    },
    organizeDetailName: { // tên chi tiết
        type: String,
        require: true
    },
    level: {
        type: Number,
        require: true
    },
    range: {
        type: Number,
        require: true
    },
    listOrganizeDetailId: [
        {

            level: Number,
            organizeDetailId: Number,
            _id: false

        }
    ],
    content: [
        {
            key: String,
            value: mongoose.Schema.Types.Mixed,
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
    }
}, {
    collection: 'QLC_OrganizeDetail',
    versionKey: false,
    timestamp: true,

});
OrganizeDetail.path('content').schema.options._id = false;
module.exports = mongoose.model('QLC_OrganizeDetail', OrganizeDetail)