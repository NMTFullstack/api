const mongoose = require("mongoose");
const video_ai_Schema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true,
        },
        id_blog: {
            type: Number,
            default: 0,
        },
        type: {
            type: Number,
            default: 1,
        },
        com_name: {
            type: String,
            default: "",
        },
        id_youtube: {
            type: String,
            default: "",
        },
        title: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            default:
                " Tìm việc làm mới nhất tại: https://timviec365.vn, Mẫu CV xin việc hot nhất: https://timviec365.vn/cv-xin-viec ",
        },
        link_blog: {
            type: String,
            default: "",
        },
        link_youtube: {
            type: String,
            default: "",
        },
        link_server: {
            type: String,
            default: "",
        },
        status_server: {
            type: Number,
            default: 0,
        },
        upload_face: {
            type: Boolean,
            default: false,
        },
        upload_twitter: {
            type: Boolean,
            default: false,
        },
        upload_ig: {
            type: Boolean,
            default: false,
        },
        upload_tiktok: {
            type: Boolean,
            default: false,
        },
    },
    {
        collection: "VideoAi",
        versionKey: false,
        timestamp: true,
    }
);
module.exports = mongoose.model("VideoAi", video_ai_Schema);
