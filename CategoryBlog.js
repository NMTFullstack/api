const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    _id: {
        type: Number,
        required: true,
    },
    categoryName: {
        type: String,
        require: true,
    },
    alias: {
        type: String,
        require: true,
    },
    date_create: {
        type: Date,
        require: true,
    },
}, {
    collection: 'QLC_CategoryBlogAdmin',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model("CategoryBlogAdmin", categorySchema);