const QRCode = require('qrcode')

const formatPhoneNumber = (value) => {
  // Faqat raqamlar
  const phoneNumber = value?.toString().replace(/[^\d]/g, '')

  // Agar raqam 9 ta bo'lsa, telefon raqamini formatlash
  if (phoneNumber?.length >= 12) {
    return (
      '+998 (' +
      phoneNumber.slice(3, 5) +
      ') ' +
      phoneNumber.slice(5, 8) +
      '-' +
      phoneNumber.slice(8, 10) +
      '-' +
      phoneNumber.slice(10, 12)
    )
  }

  return phoneNumber // Raqamlar uzunligi 9 dan katta bo'lsa, qaytarish
}

/**
 * Berilgan qiymatni valyuta formatiga o'zgartiradi
 * @param {number} value - Formatlanadigan qiymat
 * @param {string} currency - Valyuta kodi (masalan, "UZS", "USD")
 * @param {string} locale - Hudud kodi (masalan, "uz-UZ", "en-US")
 * @returns {string} Formatlangan valyuta
 */
const formatCurrency = (value, currency = 'UZS', locale = 'uz-UZ') => {
  try {
    if (value == 0 || value < 0 || isNaN(value)) {
      return 0
    } else {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(value)
    }
  } catch (error) {
    console.error('Valyuta formatlashda xatolik:', error)
    return 0 // Xatolik bo'lsa, oddiy qiymatni qaytaradi
  }
}

const categorizeSalesByDate = (sales, productId = null, customerId = null) => {
  // Filtrni qo'llash (mijoz yoki mahsulot bo'yicha)
  const filteredSales = sales.filter(sale => {
    let productMatch = productId ? sale.productId === productId : true
    let customerMatch = customerId ? sale.customerId === customerId : true
    return productMatch && customerMatch
  })

  // Ma'lumotlarni kunlar bo'yicha guruhlash
  const salesByDate = filteredSales.reduce((acc, sale) => {
    if (!acc[sale.date]) {
      acc[sale.date] = []
    }
    acc[sale.date].push(sale)
    return acc
  }, {})

  // Natijani massivga aylantirish va umumiy qiymatlarni hisoblash
  return Object.entries(salesByDate).map(([date, daySales]) => {
    const totalQuantity = daySales.reduce(
      (sum, sale) => sum + sale.totalQuantity,
      0
    )
    const totalSales = daySales.reduce((sum, sale) => sum + sale.totalSales, 0)
    const salesCount = daySales.reduce((sum, sale) => sum + sale.salesCount, 0)

    return {
      date,
      totalQuantity,
      totalSales,
      salesCount,
      details: daySales // Kundagi har bir sotuvni batafsil ko‘rish uchun
    }
  })
}

const htmlCreator = async (sale, url) => {
  const qrCodeDataUrl = await QRCode.toDataURL(url)

  return `
  <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>

    <style>
      @media print {
        * {
          padding: 0;
          margin: 0;
          box-sizing: border-box;
        }
        body {
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: #000;
          margin: 3px;
        }
        .w-container {
          width: 100%;
          margin: 0 auto;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          text-align: left;
        }
        .title {
          font-size: 12px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .section {
          margin-bottom: 20px;
        }
        .payment {
          width: 25px;
          height: 25px;
        }

        .box {
          display: flex;
          align-items: center;
        }
        .line {
        height: 100%;
          border-bottom: 1px dashed black;
          flex-grow:1;
       
        }
        .details {
          margin-bottom: 10px;
          display: flex;
          justify-content: space-between;
        }
        .capital {
          font-weight: bold;
        }
        .total {
          margin-top: 20px;
          font-weight: bold;
        }
        .button {
          padding: 10px 20px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }
        .line-container {
          width: 100%;
          display: flex;
          align-items: center;
        }

        .line {
        height: 100%;
          border-bottom: 1px dashed black;
                    flex-grow:1;
                 

        }
      }
      /* Web uchun dizayn */
      * {
        padding: 0;
        margin: 0;
        box-sizing: border-box;
      }
      
      .w-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        padding: 5px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        text-align: left;
      }
      .title {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 20px;
      }
      .section {
        margin-bottom: 20px;
      }
      .payment {
        width: 25px;
        height: 25px;
      }

      .box {
        display: flex;
        align-items: center;
      }
      .line {
        height: 100%;
        border-bottom: 1px dashed black;
        flex-grow: 1;
     

      }
      .details {
        margin-bottom: 10px;
        display: flex;
        justify-content: space-between;
      }
      .details span:first-child {
        font-weight: bold;
      }
      .total {
        margin-top: 20px;
        font-weight: bold;
      }
      .button {
        padding: 10px 20px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      .line-container {
        width: 100%;
        
        display: flex;
        align-items: end;
      }

      .line {
        height: 100%;
        border-bottom: 1px dashed black;
        flex-grow:1;
     
        }
    </style>
  </head>
  <body>
    <div class="w-container">
      <div class="title">ID${sale?.invoiceId}</div>
      <div class="section">
        <div class="line-container">
          <span>Sana</span>
          <div class="line"></div>
          <span>${new Date(sale?.date).toLocaleDateString()}</span>
        </div>
      </div>
      <div class="section">
        <p class="capital">Mijoz</p>
        <div class="line-container">
          <span>Ismi:</span>
          <div class="line"></div>
          <span>${sale?.customerId?.name}</span>
        </div>
        <div class="line-container">
          <span>Telefon:</span>
          <div class="line"></div>
          <span>${formatPhoneNumber(sale?.customerId?.phoneNumber)}</span>
        </div>
        <div class="line-container">
          <span>Manzil</span>
          <div class="line"></div>
          <span>${sale?.customerId?.region}</span>
        </div>
      </div>
      <div class="section">
        <p class="capital">Sotuvchi</p>
        <div class="line-container">
          <span>Sotuvchi ismi:</span>
          <div class="line"></div>
          <span>${sale?.who?.username}</span>
        </div>
        <div class="line-container">
          <span>Telefon</span>
          <div class="line"></div>
          <span>${formatPhoneNumber(sale?.who?.phoneNumber)}</span>
        </div>
      </div>
      <div class="section">
        <div class="line-container">
          <span>To'lov usuli</span>
          <div class="line"></div>
          <span>
            ${sale?.paymentMethod}
          </span>
        </div>
      </div>
      <div class="section">
        <div class="details">
          <span class="capital">Mahsulot</span><span>Narxi</span>
        </div>
        ${sale?.outgoings?.map(
          (outgoing, index) =>
            `<span>
            <p class='capital'>
              ${index + 1}. ${outgoing?.productId?.name}
            </p>
            <div class='details'>
              <div class='line-container'>
                <span>
                ${outgoing?.quantity} X ${formatCurrency(
              outgoing?.salePrice?.cost,
              outgoing?.salePrice?.currency
            )}
                </span>
                <div class='line'></div>
                <span>
                ${formatCurrency(
                  (outgoing?.salePrice?.cost * outgoing?.quantity).toFixed(2),
                  outgoing?.salePrice?.currency
                )}
                  </span>
              </div>
            </div>
          </span>`
        )}
      </div>
      <div class="line"></div>
      <div class="section total">
        <p class="capital">Umumiy</p>
        <div class="line-container">
          <span>USD</span>
          <div class="line"></div>
          <span>${formatCurrency(
            sale?.totalPrice?.find(p => p.currency === 'USD')?.cost.toFixed(2),
            'USD'
          )}</span>
        </div>
        <div class="line-container">
          <span>UZS</span>
          <div class="line"></div>
          <span>${formatCurrency(
            sale?.totalPrice?.find(p => p.currency === 'UZS')?.cost.toFixed(2),
            'UZS'
          )}</span>
        </div>
        <div class="line-container">
          <span>Berilgan chegirma</span>
          <div class="line"></div>
          <span>${`${sale?.discountApplied ? sale?.discountApplied : 0}%`}</span>
        </div>
      </div>
      <img src="${qrCodeDataUrl}" alt="QR Code" />
    </div>
  </body>
</html>

  `
}
module.exports = { formatPhoneNumber, formatCurrency, htmlCreator }
