const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');


// Error handling middleware
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Mahsulot qo'shish
router.post('/products', asyncHandler(async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.status(201).send(product);
}));

// Barcha mahsulotlarni ko'rish
router.get('/products', asyncHandler(async (req, res) => {
    const products = await Product.find({ status: true });
    if (products.length) {
        res.send(products);
    } else {
        res.status(400).send({ message: "Mahsulot omborda qolmagan" })
    }
}));

// ID orqali mahsulotni ko'rish
router.get('/products/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).send({ error: "Mahsulot topilmadi" });
    res.send(product);
}));

// Mahsulotni yangilash
router.put('/products/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedProduct) return res.status(404).send({ error: "Mahsulot topilmadi" });
    res.send(updatedProduct);
}));

// Mahsulotni o'chirish
router.delete('/products/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findOneAndUpdate({ _id: id }, { status: false });
    if (!product) return res.status(404).send({ error: "Mahsulot topilmadi" });

    await Inventory.deleteMany({ productId: id }); // Mahsulotga tegishli inventarni o'chirish
    res.send({ message: "Mahsulot holati o'zgartirildi va inventar o'chirildi", product });
}));

// Global xatolarni boshqarish middleware
router.use((err, req, res, next) => {
    console.error(err.stack); // Konsolda xatoni chiqarish
    res.status(500).send({ error: "Serverda xatolik yuz berdi" });
});

module.exports = router;

module.exports = router;
