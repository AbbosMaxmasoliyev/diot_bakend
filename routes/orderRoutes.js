// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const calculateDiscount = require('../utils/discountCalculator');

// All Orders - GET /orders
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().populate('customerId').populate('products.productId');
        res.send(orders);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Get Order by ID - GET /orders/:id
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('customerId').populate('products.productId');
        if (!order) return res.status(404).send("Buyurtma topilmadi");
        res.send(order);
    } catch (err) {
        res.status(500).send("Server error");
    }
});

// Create New Order - POST /orders
router.post('/orders', async (req, res) => {
    const { customerId, products, paymentMethod, discountApplied: discount } = req.body;

    if (!['cash', 'card', 'transfer', "debit"].includes(paymentMethod)) {
        return res.status(400).send("To'lov turi noto'g'ri");
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).send("Mijoz topilmadi");

    let totalPrice = 0;
    for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
            return res.status(400).send("Yetarli zaxira yo'q");
        }
        totalPrice += product.price * item.quantity;
        product.stock -= item.quantity;
        await product.save();
    }

    const finalPrice = totalPrice * (1 - discount);

    const order = new Order({
        customerId,
        products,
        totalPrice: finalPrice,
        discountApplied: discount * 100,
        paymentMethod,
    });
    await order.save();

    res.send(order);
});

// Update Order - PUT /orders/:id
router.put('/orders/:id', async (req, res) => {
    const { customerId, products, paymentMethod } = req.body;

    if (!['cash', 'card', 'transfer', "debit"].includes(paymentMethod)) {
        return res.status(400).send("To'lov turi noto'g'ri");
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send("Buyurtma topilmadi");

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).send("Mijoz topilmadi");

    let totalPrice = 0;
    for (const item of products) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
            return res.status(400).send("Yetarli zaxira yo'q");
        }
        totalPrice += product.price * item.quantity;
    }

    const discount = calculateDiscount(customer.distance);
    const finalPrice = totalPrice * (1 - discount);

    order.customerId = customerId;
    order.products = products;
    order.totalPrice = finalPrice;
    order.discountApplied = discount * 100;
    order.paymentMethod = paymentMethod;

    await order.save();
    res.send(order);
});

// Delete Order - DELETE /orders/:id
router.delete('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).send("Buyurtma topilmadi");

        // Restore product stocks
        for (const item of order.products) {
            const product = await Product.findById(item.productId);
            product.stock += item.quantity;  // Restore the stock when deleting an order
            await product.save();
        }

        await order.remove();  // Remove the order
        res.send("Buyurtma o'chirildi");
    } catch (err) {
        res.status(500).send("Server error");
    }
});


module.exports = router;
