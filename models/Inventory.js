// models/Inventory.js
const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: { type: mongoose.Types.ObjectId, ref: "Product", required: true },
    totalQuantity: { type: Number, required: true, default: 0 },
    income: [{ type: mongoose.Types.ObjectId, ref: "Income", required: true }],
    outgoings: [{ type: mongoose.Types.ObjectId, ref: "Outgoing", required: true }],
    price: { cost: { type: Number, required: true }, currency: { type: String, enum: ["UZS", "USD"] } },

}, { timestamps: true });



const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
