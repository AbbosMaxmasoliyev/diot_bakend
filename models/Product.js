const mongoose = require('mongoose');
const Inventory = require('./Inventory'); // Inventory modelini import qilamiz

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,

    category: String,
    createdAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now },
    who: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // User ID 
    }
});

productSchema.pre('findOneAndDelete', async function (next) {
    try {
        const query = this.getQuery(); // So'rov shartlarini olamiz
        const productId = query._id; // _id ni so'rov shartlaridan olamiz

        if (!productId) {
            return next(new Error("Mahsulot ID topilmadi"));
        }

        await Inventory.deleteMany({ productId }); // Mahsulotga tegishli inventarni o'chirish
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware: updateMany so'rovlari uchun updatedAt ni yangilash
productSchema.pre('updateMany', async function (next) {
    try {
        this.set({ updatedAt: new Date() }); // updatedAt vaqtini yangilash
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware: updateOne so'rovlari uchun updatedAt ni yangilash
productSchema.pre('updateOne', async function (next) {
    try {
        this.set({ updatedAt: new Date() }); // updatedAt vaqtini yangilash
        next();
    } catch (error) {
        next(error);
    }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
