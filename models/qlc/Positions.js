const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Positionschema = new Schema({

    id: { // id bảng
        type: Number,
        require: true
    },
    comId: { // id công ty
        type: Number,
        require: true
    },

    positionName: { // tên chức vụ
        type: String,
        require: true
    },
    level: {
        type: Number,
        require: true
    },
    isManager: {
        type: Number,
        require: true,
        default: 0
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
    collection: 'QLC_Positions',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_Positions', Positionschema)