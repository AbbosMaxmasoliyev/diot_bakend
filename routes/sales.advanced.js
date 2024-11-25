const express = require('express');
const { Product, Inventory } = require('../models/InventoryAdvanced');
const router = express.Router();

// Sotuvni yaratish
router.post('/create', async (req, res) => {
    const { productId, quantity, totalPrice, customerName, customerPhone, paymentMethod, shippingAddress } = req.body;

    try {
        // Mahsulotni tekshirish
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Mahsulot topilmadi!' });
        }

        // Inventarizatsiyani tekshirish
        const inventory = await Inventory.findOne({ productId: productId });
        if (!inventory || inventory.quantity < quantity) {
            return res.status(400).json({ message: 'Siz so\'ragan miqdor mavjud emas!' });
        }

        // Sotuvni yaratish (Buyurtma)
        // Inventarizatsiyani yangilash
        inventory.quantity -= quantity;
        await inventory.save();

        res.status(201).json({
            saleId: new Date().getTime(),  // Sotuv ID (prototip uchun vaqtni ishlatyapmiz)
            productId: productId,
            quantity: quantity,
            totalPrice: totalPrice,
            customerName: customerName,
            shippingAddress: shippingAddress,
            status: 'pending', // Yangi buyurtma
            orderDate: new Date(),
            estimatedDelivery: new Date(new Date().setDate(new Date().getDate() + 2)) // 2 kunlik yetkazib berish
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Xatolik yuz berdi.' });
    }
});

module.exports = router;
