const mongoose = require("mongoose");
const video_ai_Schema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
        },
        id_blog: {
            type: Number,
        },
        type: {
            type: String,
        },
        com_name: {
            type: String,
        },
        id_youtube: {
            type: String,
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        link_blog: {
            type: String,
        },
        link_youtube: {
            type: String,
        },
        status_server: {
            type: Number,
        },
    },
    {
        collection: "VideoAi",
        versionKey: false,
        timestamp: true,
    }
);
module.exports = mongoose.model("VideoAi", video_ai_Schema);
