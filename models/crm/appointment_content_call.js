const mongoose = require("mongoose");
const appointment_content_call = new mongoose.Schema({
    id: {
        type: Number,
        require: true,
        unique: true,
    },
    id_appointment: {
        type: Number,
        default: 0
    },
    id_cus: {
        type: Number,
        default: 0
    },
    content_call: {
        type: String,
        default: 0
    },
    created_at: {
        type: Date,
        default: null
    }
}, {
    collection: "CRM_appointment_content_call"
});
module.exports = mongoose.model("CRM_appointment_content_call", appointment_content_call);