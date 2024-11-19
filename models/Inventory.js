// models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    totalQuantity: { type: Number, required: true, default: 0 },
    income: [{
        currentStock: { type: Number, },
        date: { type: Date, default: Date.now },
        quantity: { type: Number, },
    }],
    outgoings: [{
        currentStock: { type: Number, },
        date: { type: Date, },
        quantity: { type: Number, },
    }],
    price: { type: Number, required: true },
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
