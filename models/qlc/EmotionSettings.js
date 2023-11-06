const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const EmotionSettingsSchema = new Schema({
    //ID item cam xuc
    emotion_id: {
        type: Number,
        required: true
    },
    //ID công ty setting
    com_id: {
        type: Number,
    },
    emotion_detail: {
        type: String,
    },
    //Ngày lập 
    created_at: {
        type: Date,
        default: Date.now()
    },

    min_score: {
        type: Number,
        default: 0
    },
    max_score: {
        type: Number,
        default: 0
    },
    avg_pass_score: {
        type: Number,
        default: 0
    },
}, {
    collection: 'QLC_EmotionSettings',
    versionKey: false,
    timestamp: true
})

module.exports = mongoose.model('QLC_EmotionSettings', EmotionSettingsSchema)