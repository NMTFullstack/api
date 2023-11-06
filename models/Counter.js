const mongoose = require('mongoose');
const Schema = mongoose.Schema;
let connection = mongoose.createConnection('mongodb://localhost:27017/api-base365');
const CounterSchema = new mongoose.Schema({
    TableId: {
        type: String,
        default: ""
    },
    Count: {
        type: Number,
        default: 0
    }
}, {
    collection: 'Counter',
    versionKey: false,
    timestamp: true
})
module.exports = connection.model("Counter", CounterSchema);