const express = require('express');
const Supply = require('../models/Supply'); // Model import
const router = express.Router();

// Ta'minlovchilarni olish
router.get('/supplies/', async (req, res) => {
    try {
        const supplies = await Supply.find().sort({ createdAt: -1 });
        res.status(200).json(supplies);
    } catch (err) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Yangi ta'minlovchi qo'shish
router.post('/supplies/', async (req, res) => {
    const { name, region, phoneNumber } = req.body;

    if (!name || !region || !phoneNumber) {
        return res.status(400).json({ error: 'Barcha maydonlar to‘ldirilishi kerak' });
    }

    try {
        const newSupply = new Supply({ name, region, phoneNumber });
        const savedSupply = await newSupply.save();
        res.status(201).json(savedSupply);
    } catch (err) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Ta'minlovchini yangilash
router.put('/supplies/:id', async (req, res) => {
    const { id } = req.params;
    const { name, region, phoneNumber } = req.body;

    try {
        const updatedSupply = await Supply.findByIdAndUpdate(
            id,
            { name, region, phoneNumber },
            { new: true, runValidators: true }
        );

        if (!updatedSupply) {
            return res.status(404).json({ error: 'Ta’minlovchi topilmadi' });
        }

        res.status(200).json(updatedSupply);
    } catch (err) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

// Ta'minlovchini o'chirish
router.delete('/supplies/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedSupply = await Supply.findByIdAndDelete(id);

        if (!deletedSupply) {
            return res.status(404).json({ error: 'Ta’minlovchi topilmadi' });
        }

        res.status(200).json({ message: 'Ta’minlovchi o’chirilgan' });
    } catch (err) {
        res.status(500).json({ error: 'Server xatosi' });
    }
});

module.exports = router;
