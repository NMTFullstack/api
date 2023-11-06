const mongoose = require('mongoose');
const CVPreviewSchema = new mongoose.Schema({
    _id: {
        type: Number
    },
    lang: {
        type: String
    },
    html: {
        type: String
    },
    nameImage: {
        type: String
    },
    timeUpdate: {
        type: Number
    }
}, {
    collection: 'CVPreview',
    versionKey: false
});
module.exports = mongoose.model("CVPreview", CVPreviewSchema);
// export default mongoose.model("CVPreview", CVPreviewSchema)