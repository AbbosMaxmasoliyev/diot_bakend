const express = require('express');
const router = express.Router();
const Import = require('../models/Import');
const Inventory = require('../models/Inventory');
const Income = require('../models/Income');
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
            .populate('products.productId').populate("supplierId");

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
    const { supplier, products, paymentMethod, additionalCosts } = req.body;
    console.log(req.body);

    if (!['cash', 'card', 'transfer'].includes(paymentMethod)) {
        return res.status(400).send("To'lov turi noto'g'ri");
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).send('Mahsulotlar to\'g\'ri kiritilmagan.');
    }

    let totalCost = additionalCosts || 0;
    const updatedInventory = [];
    const incomeIds = [];

    for (const item of products) {
        if (!isValidObjectId(item.productId) || !item.quantity || !item.costPrice) {
            return res.status(400).send('Mahsulot ma\'lumotlari noto\'g\'ri.');
        }

        let inventoryItem = await Inventory.findOne({ productId: item.productId });

        if (!inventoryItem) {
            inventoryItem = new Inventory({
                productId: item.productId,
                totalQuantity: 0,
                price: item.costPrice,
                incomes: [],
            });
        } else {
            inventoryItem.price = item.costPrice; // Yangilangan narxni saqlaymiz
        }

        totalCost += item.costPrice * item.quantity;

        inventoryItem.totalQuantity += item.quantity;

        const income = new Income({
            date: new Date(),
            quantity: item.quantity,
            currentStock: inventoryItem.totalQuantity,
            productId: item.productId,
            costPrice: item.costPrice,
            incomePrice: item.incomePrice,
            supplier:supplier,
        });

        await income.save();
        inventoryItem.income.length ? inventoryItem.income.push(income._id) : inventoryItem.income = [income._id];
        updatedInventory.push(inventoryItem);

        incomeIds.push(income._id);
    }

    const importItem = new Import({
        supplierId:supplier,
        products: products.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            incomePrice: item.costPrice,
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

// Get Import by ID - GET /import/:id
router.get('/import/:id', async (req, res) => {
    try {
        if (!isValidObjectId(req.params.id)) {
            return res.status(400).send('Noto\'g\'ri import ID.');
        }

        const importItem = await Import.findById(req.params.id).populate('incomes').populate('products.productId');
        if (!importItem) return res.status(404).send("Import topilmadi");
        res.send(importItem);
    } catch (err) {
        res.status(500).send("Server xatosi yuz berdi.");
    }
});

// Update Import - PUT /import/:id
router.put('/import/:id', async (req, res) => {
    const { supplier, products, paymentMethod, additionalCosts = 0 } = req.body;

    if (!['cash', 'card', 'transfer'].includes(paymentMethod)) {
        return res.status(400).send("To'lov turi noto'g'ri");
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).send('Mahsulotlar to\'g\'ri kiritilmagan.');
    }

    if (!isValidObjectId(req.params.id)) {
        return res.status(400).send('Noto\'g\'ri import ID.');
    }

    const importItem = await Import.findById(req.params.id);
    if (!importItem) return res.status(404).send("Import topilmadi");

    let totalCost = additionalCosts || 0;
    const updatedInventory = [];

    for (const item of products) {
        if (!isValidObjectId(item.productId) || !item.quantity || !item.costPrice) {
            return res.status(400).send('Mahsulot ma\'lumotlari noto\'g\'ri.');
        }

        let inventoryItem = await Inventory.findOne({ productId: item.productId });

        if (!inventoryItem) {
            inventoryItem = new Inventory({
                productId: item.productId,
                totalQuantity: 0,
                price: item.costPrice,
                incomes: [],
            });
        } else {
            inventoryItem.price = item.costPrice;
        }

        totalCost += item.costPrice * item.quantity;

        inventoryItem.totalQuantity += item.quantity;
        updatedInventory.push(inventoryItem);
    }

    importItem.supplier = supplier;
    importItem.products = products.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        incomePrice: item.costPrice,
    }));
    importItem.totalCost = totalCost;
    importItem.additionalCosts = additionalCosts;
    importItem.paymentMethod = paymentMethod;

    await importItem.save();

    for (const inventoryItem of updatedInventory) {
        await inventoryItem.save();
    }

    res.send(importItem);
});

// Delete Import - DELETE /import/:id
router.delete('/import/:id', async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return res.status(400).send('Noto\'g\'ri import ID.');
    }

    const importItem = await Import.findById(id).populate('incomes');
    if (!importItem) {
        return res.status(404).send("Import topilmadi");
    }

    const updatedInventory = [];
    for (const income of importItem.income) {
        const incomeRecord = await Income.findById(income._id);
        if (!incomeRecord) {
            continue;
        }

        const inventoryItem = await Inventory.findOne({ productId: incomeRecord.productId });
        if (inventoryItem) {
            inventoryItem.totalQuantity -= incomeRecord.quantity;
            inventoryItem.income = inventoryItem.income.filter(inc => inc.toString() !== incomeRecord._id.toString());
            updatedInventory.push(inventoryItem);
        }

        await Income.findByIdAndDelete(incomeRecord._id);
    }

    await Import.findByIdAndDelete(id);

    for (const inventoryItem of updatedInventory) {
        await inventoryItem.save();
    }

    res.send({ message: 'Import va unga tegishli barcha ma\'lumotlar o\'chirildi.' });
});

module.exports = router;
