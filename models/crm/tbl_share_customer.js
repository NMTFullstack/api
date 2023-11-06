const mongoose = require('mongoose');
const shareCustomer = new mongoose.Schema({
    id: {
        type: Number
    },
    customer_id: {
        type: Number,
        required: true
    },
    emp_share: {
        type: Number,
        defaultl: 0
    },
    dep_id: {
        type: String,
        defaultl: null
    },
    receiver_id: {
        type: String,
        defaultl: null
    },
    role: {
        type: String
    },
    share_related_list: {
        type: Number,
        defaultl: 0
    },
    created_at: {
        type: Number
    },
    updated_at: {
        type: Number
    }
},
    {
        collection: "CRM_shareCustomer",
        versionKey: false,
        timestamps: true
    });
module.exports = mongoose.model('CRM_shareCustomer', shareCustomer);