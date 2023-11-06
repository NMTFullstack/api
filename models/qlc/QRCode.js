const mongoose = require('mongoose')
const Schema = mongoose.Schema;
//lấy danh sách vị trí công ty chấm công bằng QR
const QRCode = new Schema({
    //ID của chấm công QR
    id: {
        type: Number,
        required: true
    },
    //id công ty
    comId: {
        type: Number,
    },
    QRCodeName: {
        type: String
    },
    QRCodeUrl: {
        type: String
    },
    QRstatus: {
        type: Number
    },
    created_time: {
        type: Number,
        default: 0
    },
    update_time: {
        type: Number,
        default: 0
    }
},
    {
        collection: 'QRCode',
        versionKey: false,
        timestamp: true
    })

module.exports = mongoose.model('QRCode', QRCode)