// models/Order.js
const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
        }
    ],
    totalPrice: Number, // Hisoblangan umumiy narx
    discountApplied: Number, // Qo'llangan chegirma
    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', "debit"], required: true }, // To'lov turi,
    date: {
        type: Date,
        default: Date.now // Hozirgi vaqtni default qilib belgilaydi
    },
    outgoings: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Outgoing'
        }
    ]
}, { timestamps: true, timeseries: true, autoSearchIndex: true });

module.exports = mongoose.model('Sales', salesSchema);
