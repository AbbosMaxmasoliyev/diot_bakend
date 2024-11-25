// models/Outgoing.js
const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    quantity: {
        type: Number,
        required: true,
    },
    incomePrice: {
        type: Number,
        required: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',  // Mahsulotni referans qilish
        required: true,
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supply',  // Mahsulotni referans qilish
        required: true,
    }
});

const Income = mongoose.model('Income', incomeSchema);

module.exports = Income;
