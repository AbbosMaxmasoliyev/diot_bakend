// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    name: String,
    region: String,
    phoneNumber: String,
    status: {
        type: Boolean,
        default: true
    },
    who: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // User ID 
    }
});

module.exports = mongoose.model('Customer', customerSchema);
