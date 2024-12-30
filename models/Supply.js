// models/Supply.js
const mongoose = require('mongoose');

const supplySchema = new mongoose.Schema({
    name: String,
    region: String,
    phoneNumber: String, // masofa (km)
    status: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('Supply', supplySchema);
