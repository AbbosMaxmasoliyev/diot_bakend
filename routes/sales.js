const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales'); // Yangi nomlangan Sales modeli
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const Outgoing = require('../models/Outgoing');
const mongoose = require('mongoose');

// All Sales - GET /sales
router.get('/sales', async (req, res) => {
  try {
    const { days, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Date filtering
    if (days === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    } else if (days === 'last-week') {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filter.createdAt = { $gte: lastWeek, $lte: today };
    } else if (days === 'last-month') {
      const today = new Date();
      const lastMonth = new Date(today.setMonth(today.getMonth() - 1));
      filter.createdAt = { $gte: lastMonth, $lte: new Date() };
    } else if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Pagination
    const pageNumber = Math.max(1, parseInt(page));
    const limitNumber = Math.max(1, parseInt(limit));
    const skip = (pageNumber - 1) * limitNumber;

    const totalSales = await Sales.countDocuments(filter);
    const sales = await Sales.find(filter)
      .skip(skip)                          // Sahifalash uchun belgilangan sonni o'tkazib yuborish
      .limit(limitNumber)                  // Belgilangan sonicha yozuvni olish
      .populate({
        path: 'outgoings',                 // "outgoings"ni bog'lash
        populate: { path: 'productId' }    // "outgoings.productId"ni ham bog'lash
      })
      .populate('customerId')
      .populate("who");

    res.json({
      totalSales,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalSales / limitNumber),
      sales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error occurred while fetching sales data.' });
  }
});

// Get Sales Report - GET /sales/report
router.get('/sales/report', async (req, res) => {
  try {
    const { startDate, endDate, productId, customerId } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate);
    } else {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchFilter.createdAt = { $gte: oneMonthAgo };
    }

    if (customerId) matchFilter.customerId = mongoose.Types.ObjectId(customerId);

    const report = await Sales.aggregate([
      { $match: matchFilter },
      { $unwind: '$products' },
      ...(productId
        ? [{ $match: { 'products.productId': mongoose.Types.ObjectId(productId) } }]
        : []),
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } },
          totalQuantity: { $sum: '$products.quantity' },
          totalSales: { $sum: { $multiply: ['$products.quantity', '$products.price'] } },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    res.status(200).json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Get Sale by ID - GET /sales/:id
router.get('/sales/:id', async (req, res) => {
  try {
    const salesItem = await Sales.findById(req.params.id, { productId: 0 })
      .populate('customerId')
      .populate('outgoings.productId')
      .populate("who");
    if (!salesItem) return res.status(404).send('Savdo topilmadi');
    res.send(salesItem);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Create New Sale - POST /sales
router.post('/sales', async (req, res) => {
  try {
    const { customerId, products, paymentMethod, discountApplied, totalPrice } = req.body;
    console.log(req.body);

    if (!['cash', 'card', 'transfer', 'debit'].includes(paymentMethod)) {
      return res.status(400).send('To\'lov turi noto\'g\'ri');
    }

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).send('Mijoz topilmadi');

    const updatedInventory = [];
    const outgoingIds = [];

    for (const item of products) {
      const inventoryItem = await Inventory.findOne({ productId: item.productId });
      console.log(item, "=>>>> ITEM")
      if (!inventoryItem || inventoryItem.totalQuantity < item.quantity) {
        return res.status(400).send(`Omborda mahsulot yetarli emas: ${item.productId}`);
      }

      inventoryItem.totalQuantity -= item.quantity;

      const outgoing = new Outgoing({
        date: new Date(),
        quantity: item.quantity,
        currentStock: inventoryItem.totalQuantity,
        productId: item.productId,
        salePrice: item.price,
      });

      await outgoing.save();
      inventoryItem.outgoings.push(outgoing._id);
      updatedInventory.push(inventoryItem);
      outgoingIds.push(outgoing._id);
    }

    const salesItem = new Sales({
      customerId,
      products: products.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      totalPrice: [{
        cost: totalPrice.UZS,
        currency: "UZS"
      }, {
        cost: totalPrice.USD,
        currency: "USD"
      }],
      discountApplied,
      paymentMethod,
      outgoings: outgoingIds,
      who: req.user.id
    });

    await salesItem.save();
    for (const inventoryItem of updatedInventory) {
      await inventoryItem.save();
    }

    res.send(salesItem);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    // Tekshirish: Faqat to'lov turini yangilashga ruxsat beriladi
    if (!['cash', 'card', 'transfer', 'debit'].includes(paymentMethod)) {
      return res.status(400).send('To\'lov turi noto\'g\'ri');
    }

    const sale = await Sales.findById(id);
    if (!sale) return res.status(404).send('Sotuv topilmadi');

    // Faqat to'lov turini yangilash
    sale.paymentMethod = paymentMethod;

    await sale.save();

    res.send(sale);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server xatosi');
  }
});

// Delete Sale - DELETE /sales/:id
router.delete('/sales/:id', async (req, res) => {
  try {
    const salesItem = await Sales.findById(req.params.id).populate('outgoings');
    if (!salesItem) return res.status(404).send('Sotuv topilmadi');

    const updatedInventory = [];
    for (const outgoing of salesItem.outgoings) {
      console.log(outgoing);

      const outgoingRecord = await Outgoing.findById(outgoing);
      const inventoryItem = await Inventory.findOne({ productId: outgoingRecord.productId });
      inventoryItem.totalQuantity += outgoingRecord.quantity;
      inventoryItem.outgoings.pull(outgoingRecord._id);
      updatedInventory.push(inventoryItem);
      await outgoingRecord.deleteOne();
    }

    await Sales.findByIdAndDelete(req.params.id);
    for (const inventoryItem of updatedInventory) {
      await inventoryItem.save();
    }

    res.send({ message: 'Sotuv va unga tegishli barcha ma\'lumotlar o\'chirildi.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
