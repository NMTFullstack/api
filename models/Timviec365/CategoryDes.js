const mongoose = require('mongoose');
const CategoryDesSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
    },
    cate_id: {
        type: Number,
        default: 0
    },
    city_id: {
        type: Number,
        default: 0
    },
    cate_des: {
        type: String,
        default: null
    },
    cate_h1: {
        type: String,
        default: null
    },
    cate_tt: {
        type: String,
        default: null
    },
    cate_tt1: {
        type: String,
        default: null
    },
    cate_descri: {
        type: String,
        default: null
    },
    cate_tdgy: {
        type: String,
        default: null
    },
    cate_ndgy: {
        type: String,
        default: null
    },
    cate_key: {
        type: String,
        default: null
    },
    cate_time: {
        type: Number,
        default: 0
    }
}, {
    collection: 'CategoryDes',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model("CategoryDes", CategoryDesSchema);