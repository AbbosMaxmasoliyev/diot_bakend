// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    region: String,
    phoneNumber: String, // masofa (km)
    distance: Number, // masofa (km)
    discountRate: Number, // chegirma stavkasi (%)
});

module.exports = mongoose.model('Customer', customerSchema);
