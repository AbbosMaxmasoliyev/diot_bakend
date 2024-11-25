// routes/salesRoutes.js
const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const Customer = require('../models/Customer');
const Inventory = require('../models/Inventory');
const calculateDiscount = require('../utils/discountCalculator');
const Outgoing = require('../models/Outgoing');
const { default: mongoose } = require('mongoose');

// All Sales - GET /sales
router.get('/sales', async (req, res) => {
  try {
    const { days, startDate, endDate, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Determine the date filter based on query parameters
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

    // Pagination parameters
    const pageNumber = Math.max(1, parseInt(page)); // Ensure page >= 1
    const limitNumber = Math.max(1, parseInt(limit)); // Ensure limit >= 1
    const skip = (pageNumber - 1) * limitNumber;

    // Count total documents for pagination
    const totalSales = await Sales.countDocuments(filter);

    // Fetch paginated sales data
    const sales = await Sales.find(filter)
      .skip(skip)
      .limit(limitNumber)
      .populate('outgoings')
      .populate('products.productId')
      .populate('customerId');

    // Respond with data
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


router.get('/sales/report', async (req, res) => {
  try {
    const { startDate, endDate, productId, customerId } = req.query;

    // Match filter yaratish
    const matchFilter = {};

    // Vaqt oralig'i bo'yicha filtr
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) {
        matchFilter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchFilter.createdAt.$lte = new Date(endDate);
      }
    } else {
      // Hech qanday vaqt oralig'i berilmasa, oxirgi bir oylik ma'lumotlarni qaytarish
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchFilter.createdAt = { $gte: oneMonthAgo };
    }

    // Customer ID bo'yicha filtr
    if (customerId) {
      matchFilter.customerId = new mongoose.Types.ObjectId(customerId);
    }

    // console.log("Initial Match filter:", matchFilter);

    // Aggregation pipeline
    const report = await Sales.aggregate([
      { $match: matchFilter }, // Filtrlarni qo'llash
      { $unwind: "$products" }, // Mahsulotlarni ajratib olish
      // Faqat kerakli productId bo'yicha filtr
      ...(productId ? [{ $match: { "products.productId": new mongoose.Types.ObjectId(productId) } }] : []),
      {
        $group: {
          _id: {
            date: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }, // Sana bo'yicha guruhlash
            },
            ...(productId && { productId: "$products.productId" }), // Mahsulotni kiritish agar kerak bo'lsa
            ...(customerId && { customerId: "$customerId" }), // Mijozni kiritish agar kerak bo'lsa
          },
          totalQuantity: { $sum: "$products.quantity" }, // Umumiy miqdor
          totalSales: {
            $sum: {
              $multiply: ["$products.quantity", "$products.price"], // Mahsulot summasi
            },
          },
          salesCount: { $sum: 1 }, // Sotuvlar soni
        },
      },
      { $sort: { "_id.date": 1 } }, // Sanani tartiblash
    ]);

    // console.log("Report:", report);

    // Hisobotni formatlash
    const formattedReport = report.map(item => ({
      date: item._id.date,
      ...(item._id.productId && { productId: item._id.productId }),
      ...(item._id.customerId && { customerId: item._id.customerId }),
      totalQuantity: item.totalQuantity,
      totalSales: item.totalSales,
      salesCount: item.salesCount,
    }));


    // console.log(formattedReport);

    res.status(200).json(formattedReport);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});




// Get Sales by ID - GET /sales/:id
router.get('/sales/:id', async (req, res) => {
  try {
    const salesItem = await Sales.findById(req.params.id).populate('customerId').populate('products.productId');
    if (!salesItem) return res.status(404).send("Savdo topilmadi");
    res.send(salesItem);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Create New Sales - POST /sales
// Create New Sales - POST /sales
router.post('/sales', async (req, res) => {
  const { customerId, products, paymentMethod, discountApplied: discount } = req.body;
  // console.log(req.body);

  if (!['cash', 'card', 'transfer', 'debit'].includes(paymentMethod)) {
    return res.status(400).send("To'lov turi noto'g'ri");
  }

  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).send("Mijoz topilmadi");

  let totalPrice = 0;
  const updatedInventory = [];
  const outgoingIds = [];  // Outgoinglar uchun _id larni saqlash

  // Mahsulotlarni qayta ishlash
  for (const item of products) {
    const inventoryItem = await Inventory.findOne({ productId: item.productId });
    // console.log(inventoryItem);

    if (!inventoryItem || Number(inventoryItem.totalQuantity) < Number(item.quantity)) {
      return res.status(400).send(`Omborda mahsulot yetarli emas: ${item.productId}`);
    }

    // Hisoblash
    totalPrice += inventoryItem.price * item.quantity;

    // Ombordan mahsulotni chiqarish
    inventoryItem.totalQuantity -= item.quantity;

    // Outgoingni yaratish
    const outgoing = new Outgoing({
      date: new Date(),
      quantity: item.quantity,
      currentStock: inventoryItem.totalQuantity,
      productId: item.productId,
      salePrice: item.price
    });

    await outgoing.save();  // Outgoingni saqlash

    // Outgoingni inventorga qo'shish
    inventoryItem.outgoings.length ? inventoryItem.outgoings.push(outgoing._id) : inventoryItem.outgoings = [outgoing._id];  // Faqat outgoing _id sini qo'shish
    updatedInventory.push(inventoryItem);  // Yangilangan inventarni saqlash

    // Outgoing _id ni outgoingIds arrayiga qo'shish
    outgoingIds.push(outgoing._id);  // Outgoingning _id sini salesga qo'shish
  }

  // Umumiy narxga chegirma hisoblash
  const finalPrice = totalPrice * (1 - (discount / 100));

  // Savdo yozuvini yaratish
  const salesItem = new Sales({
    customerId,
    products: products.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      outgoingId: outgoingIds.find(id => id.toString() === item.productId.toString())
    })),
    totalPrice: finalPrice,
    discountApplied: discount,
    paymentMethod,
    outgoings: outgoingIds,  // Outgoing _id larini salesga qo'shish
  });

  await salesItem.save();  // Sotuvni saqlash
  // console.log(salesItem);

  // Omborni yangilash
  for (const inventoryItem of updatedInventory) {
    await inventoryItem.save();  // Yangilangan inventorni saqlash
  }

  res.send(salesItem);  // Javobni yuborish
});



// Update Sales - PUT /sales/:id
router.put('/sales/:id', async (req, res) => {
  const { customerId, products, paymentMethod } = req.body;

  if (!['cash', 'card', 'transfer', "debit"].includes(paymentMethod)) {
    return res.status(400).send("To'lov turi noto'g'ri");
  }

  const salesItem = await Sales.findById(req.params.id);
  if (!salesItem) return res.status(404).send("Savdo topilmadi");

  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).send("Mijoz topilmadi");

  let totalPrice = 0;
  const updatedInventory = [];

  for (const item of products) {
    const inventoryItem = await Inventory.findOne({ productId: item.productId });
    if (!inventoryItem || inventoryItem.totalQuantity < item.quantity) {
      return res.status(400).send(`Omborda mahsulot yetarli emas: ${item.productId}`);
    }

    // Hisoblash
    totalPrice += inventoryItem.price * item.quantity;

    // Ombordan mahsulotni chiqarish
    inventoryItem.totalQuantity -= item.quantity;
    inventoryItem.outgoings.push({
      date: new Date(),
      quantity: item.quantity,
      currentStock: inventoryItem.totalQuantity,
    });

    updatedInventory.push(inventoryItem);
  }

  // Umumiy narxga chegirma hisoblash
  const discount = calculateDiscount(customer.distance);
  const finalPrice = totalPrice * (1 - discount);

  salesItem.customerId = customerId;
  salesItem.products = products;
  salesItem.totalPrice = finalPrice;
  salesItem.discountApplied = discount * 100;
  salesItem.paymentMethod = paymentMethod;

  await salesItem.save();

  // Ombor yangilash
  for (const inventoryItem of updatedInventory) {
    await inventoryItem.save();
  }

  res.send(salesItem);
});
// DELETE Sales - DELETE /sales/:id
router.delete('/sales/:id', async (req, res) => {
  const { id } = req.params;

  // Sotuvni topish
  const salesItem = await Sales.findById(id).populate('outgoings');
  if (!salesItem) {
    return res.status(404).send("Sotuv topilmadi");
  }

  // Har bir outgoingni qayta tiklash (inventarni yangilash)
  const updatedInventory = [];
  for (const outgoing of salesItem.outgoings) {
    // Outgoingni topish
    const outgoingRecord = await Outgoing.findById(outgoing._id);
    if (!outgoingRecord) {
      return res.status(404).send("Outgoing topilmadi");
    }

    // Inventarizatsiyani yangilash (quantity ni qo'shish)
    const inventoryItem = await Inventory.findOne({ productId: outgoingRecord.productId });
    if (!inventoryItem) {
      return res.status(404).send("Inventarizatsiya topilmadi");
    }
    await Inventory.updateOne(
      { productId: outgoingRecord.productId },
      { $pull: { outgoings: { _id: outgoingRecord._id } } }  // `_id` bilan outgoings arrayidan elementni olib tashlash
    );
    inventoryItem.totalQuantity += outgoingRecord.quantity; // Ombor miqdorini qaytarish
    updatedInventory.push(inventoryItem);

    // Outgoingni o'chirish
    await Outgoing.findByIdAndDelete(outgoingRecord._id);  // `remove()` o'rniga `findByIdAndDelete()` ishlatamiz
  }

  // Sotuvni o'chirish
  await Sales.findByIdAndDelete(id);  // `remove()` o'rniga `findByIdAndDelete()` ishlatamiz

  // Inventarni yangilash
  for (const inventoryItem of updatedInventory) {
    await inventoryItem.save();
  }

  res.send({ message: 'Sotuv va unga tegishli barcha ma\'lumotlar o\'chirildi.' });
});





module.exports = router;
