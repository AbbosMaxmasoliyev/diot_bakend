// routes/inventory.js
const express = require('express');
const Inventory = require('../models/Inventory');
const { default: mongoose } = require('mongoose');
const router = express.Router();




router.get('/inventory/income/report', async (req, res) => {
    try {
        const { productId, startDate, endDate } = req.query;

        // Match filter yaratish
        const matchFilter = {};

        // Mahsulot ID bo'yicha filtr
        if (productId) {
            matchFilter.productId = new mongoose.Types.ObjectId(productId);
        }

        // Vaqt oralig'i bo'yicha filtr
        if (startDate || endDate) {
            matchFilter['income.date'] = {};
            if (startDate) {
                matchFilter['income.date'].$gte = new Date(startDate);
            }
            if (endDate) {
                matchFilter['income.date'].$lte = new Date(endDate);
            }
        } else {
            // Agar vaqt oralig'i berilmagan bo'lsa, oxirgi bir oylik ma'lumotni ko'rsatish
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            matchFilter['income.date'] = { $gte: oneMonthAgo };
        }

        console.log("Match filter Inventor:", matchFilter);

        // Aggregation pipeline
        const report = await Inventory.aggregate([
            { $unwind: "$income" }, // Income massivini ajratish
            { $match: matchFilter }, // Filtrlarni qo'llash
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$income.date" }, // Sana bo'yicha guruhlash
                        },
                        // productId: "$productId", // Mahsulot ID
                    },
                    totalIncome: { $sum: "$income.quantity" }, // Umumiy kirim miqdori
                },
            },
            { $sort: { "_id.date": 1 } }, // Sanaga ko'ra tartiblash
        ]);

        console.log("Report:", report);

        // Hisobotni formatlash
        const formattedReport = report.map(item => ({
            date: item._id.date,
            productId: item._id.productId,
            totalIncome: item.totalIncome,
        }));

        res.status(200).json(formattedReport);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Inventorni olish
router.get('/inventory', async (req, res) => {
    try {
        const inventories = await Inventory.find().populate("productId");
        res.status(200).json(inventories);
    } catch (err) {
        res.status(500).json({ message: "Inventarni olishda xatolik yuz berdi", error: err.message });
    }
});



// Inventorni qo'shish
router.post('/inventory', async (req, res) => {
    const { productId, totalQuantity, income, outgoings, price } = req.body;
    console.log(req.body);


    try {
        // Mahsulotni tekshirish
        const existingInventory = await Inventory.findOne({ productId });
        console.log(totalQuantity);

        if (existingInventory) {
            // Mahsulot mavjud bo'lsa, kirimlarni yangilash
            existingInventory.totalQuantity += parseInt(totalQuantity);  // Yangi kirimni qo'shish
            existingInventory.income.push({
                currentStock: price,
                quantity: totalQuantity,
            });  // Yangi income (kirim) qo'shish

            // Mahsulotni saqlash
            await existingInventory.save();
            return res.status(200).json(existingInventory);
        }

        // Agar mahsulot mavjud bo'lmasa, yangi inventory yaratish
        const newInventory = new Inventory({
            productId,
            totalQuantity,
            income: {
                currentStock: price,
                quantity: totalQuantity,
            },
            outgoings,
            price
        });

        await newInventory.save();
        res.status(201).json(newInventory);
    } catch (err) {
        res.status(500).json({ message: "Inventar qo'shishda xatolik yuz berdi", error: err.message });
    }
});


// Inventorni yangilash
router.put('/inventory/:id', async (req, res) => {
    const { productId, totalQuantity, income, outgoings, price } = req.body;

    try {
        const updatedInventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            { productId, totalQuantity, income, outgoings, price },
            { new: true }
        );
        res.status(200).json(updatedInventory);
    } catch (err) {
        res.status(500).json({ message: "Inventarni yangilashda xatolik yuz berdi", error: err.message });
    }
});

// Inventorni o'chirish
router.delete('/inventory/:id', async (req, res) => {
    try {
        const deletedInventory = await Inventory.findByIdAndDelete(req.params.id);
        res.status(200).json(deletedInventory);
    } catch (err) {
        res.status(500).json({ message: "Inventarni o'chirishda xatolik yuz berdi", error: err.message });
    }
});

module.exports = router;
