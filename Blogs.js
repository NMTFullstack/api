const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
    },
    category: {
        type: Number,
        require: true,
    },
    title: {
        type: String,
        require: true,
    },
    content: {
        type: String,
        require: true,
    },
    description: {
        type: String,
        require: true,
    },
    img: {
        type: Array,
    },
    relatedContent: {
        type: String,
    },
    relatedTitle: {
        type: Array,
    },
    date_create: {
        type: Date,
        require: true,
    },
    date_modified: {
        type: Date,
        require: true,
    },
    id_author: {
        type: Number,
        require: true,
    },
    keyWord: {
        type: String,
    },
    alias: {
        type: String
    }
}, {
    collection: 'QLC_Blog',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model("Blogs", blogSchema);