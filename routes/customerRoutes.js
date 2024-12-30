// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Mijoz qo'shish
router.post('/customers', async (req, res) => {
    const { name, region, phoneNumber } = req.body;
    try {

        const customer = new Customer({ name, region, phoneNumber });
        await customer.save();
        res.send(customer);
    } catch (error) {
        res.status(500).send({ error: "Internal server error" })
    }
});

// Barcha mijozlarni ko'rish
router.get('/customers', async (req, res) => {
    try {

        const customers = await Customer.find({ status: true });
        res.send(customers);
    } catch (error) {
        res.status(500).send({ error: "Internal server error" })

    }
});


// Mijozni ID orqali ko'rish
router.get('/customers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const customer = await Customer.findById(id);

        if (!customer) {
            return res.status(404).send({ error: "Mijoz topilmadi" });
        }

        res.send(customer);
    } catch (err) {
        res.status(500).send({ error: "ID orqali mijozni olishda xatolik yuz berdi" });
    }
});
// Mijozni yangilash
router.put('/customers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, region, phoneNumber } = req.body;

    try {

        const updatedCustomer = await Customer.findByIdAndUpdate(
            id,
            { ...req.body },
            { new: true, runValidators: true }
        );

        if (!updatedCustomer) {
            return res.status(404).send({ error: "Mijoz topilmadi" });
        }

        res.send(updatedCustomer);
    } catch (err) {
        res.status(400).send({ error: "Mijozni yangilashda xatolik yuz berdi" });
    }
});

// Mijozni o'chirish
router.delete('/customers/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const deletedCustomer = await Customer.findByIdAndUpdate(id, { status: false });

        if (!deletedCustomer) {
            return res.status(404).send({ error: "Mijoz topilmadi" });
        }

        res.send({ message: "Mijoz muvaffaqiyatli o'chirildi" });
    } catch (err) {
        res.status(500).send({ error: "Mijozni o'chirishda xatolik yuz berdi" });
    }
});

module.exports = router;
