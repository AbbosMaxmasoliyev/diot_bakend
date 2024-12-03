// models/Income.js
const mongoose = require('mongoose');

const importSchema = new mongoose.Schema({
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supply' }, // Yetkazib beruvchi ID
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Mahsulot ID
            quantity: Number, // Miqdor,
            incomePrice: {
                cost: Number,
                currency: {
                    type: String,
                    enum: ["USD", "UZS"]
                }
            }
        }
    ],
    totalCost: [{
        cost: { type: Number, required: true }, // Xarajat qiymati
        currency: {
            type: String,
            enum: ["USD", "UZS"], // Valyuta faqat USD yoki UZS bo'lishi kerak
            required: true
        },
    }], // Hisoblangan umumiy narx
    additionalCosts: {
        cost: Number,
        currency: {
            type: String,
            enum: ["UZS", "USD"]
        }
    }, // Olingan chegirma
    paymentMethod: { type: String, enum: ['cash', 'card', 'transfer', "debit"], required: true }, // To'lov turi
    date: {
        type: Date,
        default: Date.now // Hozirgi vaqtni default qilib belgilaydi
    },
    incomes: [
        {
            type: mongoose.Schema.Types.ObjectId, ref: 'Income' // Income ID lar
        }
    ]
}, { timestamps: true, timeseries: true, autoSearchIndex: true });

module.exports = mongoose.model('Import', importSchema);
