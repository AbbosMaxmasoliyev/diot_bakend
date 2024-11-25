// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    region: String,
    phoneNumber: String, // masofa (km)
});

module.exports = mongoose.model('Customer', customerSchema);
