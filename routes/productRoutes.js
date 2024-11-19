const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');

// Mahsulot qo'shish
router.post('/products', async (req, res) => {
    const product = new Product(req.body);
    await product.save();
    res.send(product);
});

// Barcha mahsulotlarni ko'rish
router.get('/products', async (req, res) => {
    const products = await Product.find();
    res.send(products);
});

// ID orqali mahsulotni ko'rish
router.get('/products/:id', async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).send("Mahsulot topilmadi");
    res.send(product);
});

// Mahsulotni yangilash
router.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updatedProduct) return res.status(404).send("Mahsulot topilmadi");
    res.send(updatedProduct);
});

// Mahsulotni o'chirish
router.delete('/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOneAndDelete({ _id: id });

        res.send({ message: "Mahsulot va uning tegishli inventarlari o'chirildi", product });
    } catch (error) {
        res.status(404).send("Mahsulot topilmadi");

    }
});

module.exports = router;
