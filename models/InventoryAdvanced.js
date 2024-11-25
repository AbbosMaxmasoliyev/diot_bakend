// // Mahsulotlar kolleksiyasi (Products)
// const ProductSchema = new mongoose.Schema({
//     name: { type: String, required: true }, // Mahsulot nomi
//     description: { type: String, default: '' }, // Mahsulot tavsifi
//     category: { type: String, required: true }, // Mahsulot kategoriyasi (masalan: elektronika, kiyim)
//     price: { type: Number, required: true }, // Mahsulot narxi
//     createdAt: { type: Date, default: Date.now }, // Yaratilgan vaqt
//     updatedAt: { type: Date, default: Date.now } // O'zgartirilgan vaqt
// });

// // Inventarizatsiya kolleksiyasi (Inventory)
// const InventorySchema = new mongoose.Schema({
//     productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // Mahsulotga bog'lanish
//     quantity: { type: Number, required: true }, // Mahsulotning mavjud miqdori
//     location: { type: String, default: '' }, // Mahsulotning saqlanish joyi (masalan: ombor)
//     lastChecked: { type: Date, default: Date.now }, // So'nggi inventarizatsiya tekshiruvi
//     status: { type: String, enum: ['in_stock', 'out_of_stock', 'understocked'], default: 'in_stock' } // Mahsulot holati
// });

// // Inventarizatsiya tekshiruvlari (InventoryCheck)
// const InventoryCheckSchema = new mongoose.Schema({
//     inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true }, // Inventarizatsiya hujjatiga bog'lanish
//     checkedBy: { type: String, required: true }, // Tekshiruvchi xodimning ismi
//     checkDate: { type: Date, default: Date.now }, // Tekshiruv sanasi
//     quantityChecked: { type: Number, required: true }, // Tekshirilgan miqdor
//     discrepancy: { type: Number, default: 0 }, // Farq (agar mavjud bo'lsa)
//     remarks: { type: String, default: '' }, // Qo'shimcha eslatmalar
//     status: { type: String, enum: ['correct', 'discrepant'], default: 'correct' } // Tekshiruv natijasi
// });

// // Inventarizatsiya hisobotlari (InventoryReport)
// const InventoryReportSchema = new mongoose.Schema({
//     reportDate: { type: Date, default: Date.now }, // Hisobot sanasi
//     totalItemsChecked: { type: Number, required: true }, // Tekshirilgan umumiy mahsulotlar soni
//     discrepanciesFound: { type: Number, default: 0 }, // Farqlar soni
//     totalValue: { type: Number, required: true }, // Hisoblangan umumiy qiymat
//     generatedBy: { type: String, required: true }, // Hisobotni yaratgan xodim
//     reportDetails: [
//         {
//             productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Mahsulotga bog'lanish
//             expectedQuantity: { type: Number, required: true }, // Kutilgan miqdor
//             actualQuantity: { type: Number, required: true }, // Haqiqiy miqdor
//             discrepancy: { type: Number, default: 0 }, // Farq
//             price: { type: Number, required: true }, // Mahsulot narxi
//             value: { type: Number, required: true } // Mahsulotning qiymati
//         }
//     ] // Mahsulotlarga oid detallar
// });

// // Model va eksport
// const Product = mongoose.model('Product', ProductSchema);
// const Inventory = mongoose.model('Inventory', InventorySchema);
// const InventoryCheck = mongoose.model('InventoryCheck', InventoryCheckSchema);
// const InventoryReport = mongoose.model('InventoryReport', InventoryReportSchema);

// module.exports = { Product, Inventory, InventoryCheck, InventoryReport };
