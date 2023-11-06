const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AppointSchema = new Schema({
    // id tự động tăng (id bảng)
    id: {
        type: Number,
        required: true,
        unique: true,
        autoIncrement: true
    },
    // idQLC nhân viên
    ep_id: {
        type: Number,
    },
    com_id: {
        type: Number,
    },
    // id chức vụ cũ
    current_position_id: {
        type: Number,
        default: 0,
    },

    current_organizeDetailId: {
        type: Number,
        default: 0,
    },
    current_listOrganizeDetailId: [
        {

            level: Number,
            organizeDetailId: Number,
            _id: false

        }
    ],
    created_at: {
        type: Date,
        default: null
    },

    decision_id: {
        type: Number,
        default: 0,
    },
    // ly do
    note: {
        type: String,
        default: null,
    },
}, {
    collection: 'HR_Appoints',
    versionKey: false,
    timestamp: true
});

module.exports = mongoose.model("HR_Appoints", AppointSchema);