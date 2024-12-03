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
        cost: Number,
        currency: {
            type: String,
            enum: ["USD", "UZS"]
        }
    },
    currency: {
        type: String,
        enum: ["UZS", "USD"]
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
