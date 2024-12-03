const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Inventory = require('../models/Inventory');
const Income = require('../models/Income');
const Product = require('../models/Product');
const { default: mongoose } = require('mongoose');

// Helper function to validate ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Get all Imports - GET /import
router.get('/import', async (req, res) => {
    try {
        const { days, startDate, endDate, page = 1, limit = 10 } = req.query;
        const filter = {};

        if (days === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            filter.createdAt = {
                $gte: startOfDay,
                $lte: endOfDay,
            };
        } else if (days === 'last-week') {
            const today = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(today.getDate() - 7);

            filter.createdAt = {
                $gte: lastWeek,
                $lte: today,
            };
        } else if (days === 'last-month') {
            const today = new Date();
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);

            filter.createdAt = {
                $gte: lastMonth,
                $lte: today,
            };
        } else if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const pageNumber = Math.max(1, parseInt(page));
        const limitNumber = Math.max(1, parseInt(limit));
        const skip = (pageNumber - 1) * limitNumber;

        const totalImports = await Import.countDocuments(filter);

        const imports = await Import.find(filter)
            .skip(skip)
            .limit(limitNumber)
            .populate('incomes')
            .populate('products.productId')
            .populate('supplierId');

        res.json({
            totalImports,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalImports / limitNumber),
            imports,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error occurred while fetching import data.' });
    }
});

// Create New Import - POST /import
router.post('/import', async (req, res) => {
    const { supplier, products, paymentMethod, additionalCosts, totalCost } = req.body;
    console.log(req.body);

    if (!['cash', 'card', 'transfer', 'debit'].includes(paymentMethod)) {
        return res.status(400).send("Invalid payment method.");
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).send('Products are required.');
    }

    const updatedInventory = [];
    const incomeIds = [];

    for (const item of products) {
        if (!isValidObjectId(item.productId) || !item.quantity || !item.incomePrice?.cost) {
            return res.status(400).send('Invalid product data.');
        }

        const product = await Product.findById(item.productId);
        if (!product) {
            return res.status(400).send('Product not found.');
        }

        let inventoryItem = await Inventory.findOne({ productId: item.productId });

        if (!inventoryItem) {
            inventoryItem = new Inventory({
                productId: item.productId,
                totalQuantity: 0,
                price: { cost: 0, currency: "USD" },
                income: [],
                outgoings: [],
            });
        }

        inventoryItem.totalQuantity += item.quantity;
        inventoryItem.price = item.incomePrice;

        const income = new Income({
            date: new Date(),
            quantity: item.quantity,
            currentStock: inventoryItem.totalQuantity,
            productId: item.productId,
            costPrice: item.incomePrice.cost,
            supplier,
            currency: item.incomePrice.currency,
        });

        await income.save();
        inventoryItem.income.push(income._id);
        updatedInventory.push(inventoryItem);

        incomeIds.push(income._id);
    }

    const importItem = new Import({
        supplierId:supplier,
        products: products.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            incomePrice: item.incomePrice,
        })),
        totalCost,
        additionalCosts,
        paymentMethod,
        incomes: incomeIds,
    });

    await importItem.save();

    for (const inventoryItem of updatedInventory) {
        await inventoryItem.save();
    }

    res.status(201).send(importItem);
});

// Delete Import - DELETE /import/:id
router.delete('/import/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).send('Invalid import ID.');
    }

    const importItem = await Import.findById(id).populate('incomes');
    if (!importItem) {
        return res.status(404).send('Import not found.');
    }

    const updatedInventory = [];
    for (const income of importItem.incomes) {
        const incomeRecord = await Income.findById(income._id);
        if (!incomeRecord) {
            continue;
        }

        const inventoryItem = await Inventory.findOne({ productId: incomeRecord.productId });
        if (inventoryItem) {
            inventoryItem.totalQuantity -= incomeRecord.quantity;
            inventoryItem.income = inventoryItem.income.filter((inc) => inc.toString() !== incomeRecord._id.toString());
            updatedInventory.push(inventoryItem);
        }

        await Income.findByIdAndDelete(incomeRecord._id);
    }

    await Import.findByIdAndDelete(id);

    for (const inventoryItem of updatedInventory) {
        await inventoryItem.save();
    }

    res.send({ message: 'Import and associated data deleted.' });
});

module.exports = router;
