const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    cor_id: {
        type: Number,
        required: true
    },
    cor_location_name: {
        type: String,
    },
    cor_lat: {
        type: Number,
    },
    cor_long: {
        type: Number,
    },
    cor_radius: {
        type: Number,
    },
    id_com: {
        type: Number
    }

}, {
    collection: 'QLC_Location',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_Location', LocationSchema)