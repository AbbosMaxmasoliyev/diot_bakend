// models/Outgoing.js
const mongoose = require('mongoose');

const outgoingSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    currentStock: {
        type: Number,
        required: true,
    },
    salePrice: {
        cost: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ["UZS", "USD"]
        }
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',  // Mahsulotni referans qilish
        required: true,
    },
});

const Outgoing = mongoose.model('Outgoing', outgoingSchema);

module.exports = Outgoing;
