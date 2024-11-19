// utils/discountCalculator.js
function calculateDiscount(distance) {
    if (distance <= 100) return 0.10; // 10% chegirma
    if (distance <= 200) return 0.05; // 5% chegirma
    return 0.02; // uzoq masofa uchun 2% chegirma
}

module.exports = calculateDiscount;
