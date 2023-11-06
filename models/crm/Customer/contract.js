const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const crm_contract = new Schema({

    //hợp đồng bán - chi tiết KH
    id: {
        type: Number,
        unique: true,
        required: true
    },

    id_customer: {
        type: Number,
        required: true
    },

    user_created: {
        type: String
    },

    id_form_contract: {
        type: Number
    },

    status: {
        type: Boolean,
        default: false
    },

    emp_id: {
        type: Number,
        default: 0
    },
    com_id: {
        type: Number,
        required: true
    },

    filename: {
        type: String,
        required: true
    },

    path_dowload: {
        type: String,
        required: true
    },

    is_delete: {
        type: Number,
        default: 0
    },

    created_at: {
        type: Number,
        default: 0
    },

    updated_at: {
        type: Number,
        default: 0
    }

}, {
    collection: 'CRM_contract',
    versionKey: false,
    timestamp: true
})
module.exports = mongoose.model("crm_contract", crm_contract);