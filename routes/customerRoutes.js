// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Mijoz qo'shish
router.post('/customers', async (req, res) => {
    const { name, region, phoneNumber } = req.body;
    const customer = new Customer({ name, region, phoneNumber });
    await customer.save();
    res.send(customer);
});

// Barcha mijozlarni ko'rish
router.get('/customers', async (req, res) => {
    const customers = await Customer.find();
    res.send(customers);
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
        const deletedCustomer = await Customer.findByIdAndDelete(id);

        if (!deletedCustomer) {
            return res.status(404).send({ error: "Mijoz topilmadi" });
        }

        res.send({ message: "Mijoz muvaffaqiyatli o'chirildi" });
    } catch (err) {
        res.status(500).send({ error: "Mijozni o'chirishda xatolik yuz berdi" });
    }
});

module.exports = router;
