const express = require('express');
const { Product, Inventory } = require('../models/InventoryAdvanced');  // MongoDB modellari
const router = express.Router();

// Mahsulotni omborga qo'shish yoki inventarizatsiyani yangilash
router.post('/add-to-inventory', async (req, res) => {
    const { productId, quantity, location } = req.body;

    // Kiritilgan ma'lumotlar mavjudligini tekshirish
    if (!productId || !quantity || !location) {
        return res.status(400).json({ message: 'Mahsulot ID, miqdor va joyni kiriting!' });
    }

    try {
        // Mahsulotni topish
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Mahsulot topilmadi!' });
        }

        // Inventarizatsiya hujjatini tekshirish
        let inventory = await Inventory.findOne({ productId: productId, location: location });

        if (inventory) {
            // Agar inventarizatsiya mavjud bo'lsa, zaxirani yangilaymiz
            inventory.quantity += quantity;
            inventory.lastChecked = new Date();
            inventory.status = 'in_stock'; // Mahsulot holatini 'zaxirada' qilib belgilaymiz

            await inventory.save(); // O'zgartirishlarni saqlaymiz
            res.status(200).json({
                message: `Mahsulotning yangi miqdori: ${inventory.quantity}`,
                inventory
            });
        } else {
            // Agar inventarizatsiya mavjud bo'lmasa, yangi inventarizatsiya hujjati yaratamiz
            inventory = new Inventory({
                productId: productId,
                quantity: quantity,
                location: location,
                lastChecked: new Date(),
                status: 'in_stock'
            });

            await inventory.save(); // Yangi inventarizatsiya hujjatini saqlaymiz
            res.status(201).json({
                message: `Yangi mahsulot inventarizatsiya hujjati yaratildi. Miqdor: ${quantity}`,
                inventory
            });
        }
    } catch (error) {
        console.error('Xatolik:', error.message);
        res.status(500).json({ message: 'Serverda xatolik yuz berdi.' });
    }
});

module.exports = router;
