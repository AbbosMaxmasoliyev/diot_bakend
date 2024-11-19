// models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            quantity: Number,
        }
    ],
    totalPrice: Number, // Hisoblangan umumiy narx
    discountApplied: Number, // Qo'llangan chegirma
    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', "debit"], required: true }, // To'lov turi
});

module.exports = mongoose.model('Order', orderSchema);
