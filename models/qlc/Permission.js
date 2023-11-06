const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Permission = new Schema({
    com_id: {
        type: Number,
        default: 0
    },
    user_id: {
        type: Number,
        default: 0
    },
    permission_id: {
        type: String,
        default: null
    },
    created_time: {
        type: Number,
        default: 0
    },
}, {
    collection: 'QLC_Permission',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_Permission', Permission);