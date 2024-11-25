const express = require('express');
const { Product, Inventory } = require('../models/InventoryAdvanced');
const router = express.Router();

// Mahsulotni ID bo'yicha olish
router.get('/:productId', async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Mahsulot topilmadi!' });
        }

        const inventory = await Inventory.findOne({ productId: req.params.productId });
        if (!inventory) {
            return res.status(404).json({ message: 'Inventarizatsiya ma\'lumotlari topilmadi!' });
        }

        res.status(200).json({
            productId: product._id,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: inventory.quantity,
            status: inventory.status
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Xatolik yuz berdi.' });
    }
});

module.exports = router;
                            