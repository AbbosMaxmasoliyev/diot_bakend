// routes/inventory.js
const express = require('express');
const Inventory = require('../models/Inventory');
const { default: mongoose } = require('mongoose');
const Product = require('../models/Product');
const Income = require('../models/Income');
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

        // console.log("Match filter Inventor:", matchFilter);

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

        // console.log("Report:", report);

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
// Inventorni olish (qidiruv bilan)
router.get('/inventory', async (req, res) => {
    try {
        const searchQuery = req.query.search || ''; // Qidiruv so'zi
        const page = parseInt(req.query.page, 10) || 1; // Joriy sahifa raqami (default 1)
        const limit = parseInt(req.query.limit, 10) || 10; // Har bir sahifada ko'rsatiladigan elementlar soni (default 10)

        // Qidiruv uchun mahsulot ID'larini olish
        const productIds = await Product.find(
            { name: { $regex: searchQuery, $options: 'i' }, status: true }, // Qidiruv sharti
            { _id: 1 } // Faqat ID'larni olish
        ).lean().distinct('_id'); // Natijani array sifatida olish

        // Inventorydan qidirish va paginationni qo'llash
        const totalCount = await Inventory.countDocuments({
            productId: { $in: productIds }
        }); // Umumiy inventar soni

        const inventories = await Inventory.find({
            productId: { $in: productIds }
        })
            .skip((page - 1) * limit) // Sahifalarni o'tkazib yuborish
            .limit(limit) // Har bir sahifada ko'rsatiladigan elementlar soni
            .populate("productId") // Bog'langan mahsulotlarni chiqarish
            .populate("income", { productId: 0 }); // Bog'langan daromadni chiqarish

        res.status(200).json({
            data: inventories,
            totalCount, // Umumiy inventar soni
            currentPage: page, // Joriy sahifa
            totalPages: Math.ceil(totalCount / limit), // Umumiy sahifalar soni
        });
    } catch (err) {
        res.status(500).json({ message: "Inventarni olishda xatolik yuz berdi", error: err.message });
    }
});


router.get('/inventory-byId/:id', async (req, res) => {
    try {
        const paramsId = req.params.id; // Qidiruv so'zi

        // 1. Mahsulot ID'larini olish
        const inventories = await Inventory.findById(paramsId)
            .populate({
                path: 'income',
                populate: {
                    path: 'supplier', // supplier maydonini populate qilish
                    model: 'Supply', // "Supply" modelini aniqlang
                },
            })
            .populate('productId') // Mahsulot ma'lumotlarini ham populate qilish
            .populate('outgoings'); // Agar outgoing kerak bo'lsa, uni ham populate qiling

        res.status(200).json(inventories);
    } catch (err) {
        res.status(500).json({ message: "Inventarni olishda xatolik yuz berdi", error: err.message });
    }
});




// Inventorni qo'shish
router.post('/inventory', async (req, res) => {
    const { productId, totalQuantity, incomePrice, price, supply } = req.body;
    console.log(req.body);

    try {
        // Check if the product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Mahsulot topilmadi" });
        }

        // Create a new Income record
        const incomeData = new Income({
            quantity: totalQuantity,
            incomePrice: parseFloat(incomePrice),
            price,
            productId,
            supplier: supply,
        });

        await incomeData.save();

        // Check if the inventory already exists
        let inventory = await Inventory.findOne({ productId });

        if (inventory) {
            // Update existing inventory
            inventory.totalQuantity += parseInt(totalQuantity, 10);
            inventory.income.push(incomeData._id);

            await inventory.save();
        } else {
            // Create new inventory
            inventory = new Inventory({
                productId,
                totalQuantity,
                income: [incomeData._id],
                outgoings: [],
                price,
            });

            await inventory.save();
        }

        // Update the product's price to match the inventory's price
        product.price = price;
        await product.save();

        res.status(201).json(inventory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Inventar qo'shishda xatolik yuz berdi", error: err.message });
    }
});


// Inventorni yangilash
router.put('/inventory/:id', async (req, res) => {
    const { productId, totalQuantity, incomePrice, price } = req.body;

    try {
        // Find and update the inventory
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({ message: "Inventar topilmadi" });
        }

        // Update inventory fields
        inventory.totalQuantity = totalQuantity;
        inventory.price = price;

        // Find the latest income record and update its price if needed
        if (incomePrice) {
            const latestIncome = await Income.findOne({ _id: { $in: inventory.income } }).sort({ date: -1 });
            if (latestIncome) {
                latestIncome.incomePrice = parseFloat(incomePrice);
                await latestIncome.save();
            }
        }

        // Save inventory
        await inventory.save();

        // Update the product's price to match the updated inventory price
        const product = await Product.findById(productId);
        if (product) {
            product.price = price;
            await product.save();
        }

        res.status(200).json(inventory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Inventarni yangilashda xatolik yuz berdi", error: err.message });
    }
});


// Inventorni o'chirish
// Inventarni o'chirish
router.delete('/inventory/:id', async (req, res) => {
    try {
        // Find the inventory by ID
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({ message: "Inventar topilmadi" });
        }

        const productId = inventory.productId;

        // Delete associated income records
        await Income.deleteMany({ _id: { $in: inventory.income } });

        // Delete the inventory
        await inventory.deleteOne();

        // Reset the product's price to default (e.g., `null` or some other value)
        const product = await Product.findById(productId);
        if (product) {
            product.price = null; // Or set to a default value
            await product.save();
        }

        res.status(200).json({ message: "Inventar o'chirildi" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Inventarni o'chirishda xatolik yuz berdi", error: err.message });
    }
});

module.exports = router;
