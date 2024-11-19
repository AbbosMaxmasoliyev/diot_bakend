const express = require("express");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");

const router = express.Router();

// Omborga kirim bo'yicha umumiy hisobot
router.get("/inventory-report", async (req, res) => {
    try {
        const inventoryReport = await Inventory.aggregate([
            {
                $group: {
                    _id: null,
                    totalCost: { $sum: "$totalCost" },
                    totalQuantity: { $sum: "$quantity" },
                },
            },
        ]);

        res.json(inventoryReport[0]);
    } catch (error) {
        res.status(500).send("Server xatosi");
    }
});

// Sotish bo'yicha umumiy hisobot
router.get("/sales-report", async (req, res) => {
    try {
        const salesReport = await Sales.aggregate([
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalRevenue" },
                    totalQuantitySold: { $sum: "$quantity" },
                },
            },
        ]);

        res.json(salesReport[0]);
    } catch (error) {
        res.status(500).send("Server xatosi");
    }
});

module.exports = router;
