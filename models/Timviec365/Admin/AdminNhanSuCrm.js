const mongoose = require('mongoose');
const AdminNhanSuCrmSchema = new mongoose.Schema({
    id_ns: {
        type: Number,
        required: true,
    },
    id_com: {
        type: Number,
    },
    list_ns: {
        type: String,
    },
    list_cate: {
        type: String,
    },
    list_keyword: {
        type: String,
    },
    list_city: {
        type: String,
    },
    active: {
        type: Number,
    },
    time_created: {
        type: Number,
    },
    time_end: {
        type: Number,
    },
}, {
    collection: 'Tv365AdminMenuOrder',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model("Tv365AdminMenuOrder", AdminNhanSuCrmSchema);