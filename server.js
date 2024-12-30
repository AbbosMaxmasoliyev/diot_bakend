// server.js
const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const path = require('path')
const cors = require('cors')
const customerRoutes = require('./routes/customerRoutes')
const productRoutes = require('./routes/productRoutes')
const orderRoutes = require('./routes/orderRoutes')
const inventoryRoutes = require('./routes/inventory')
const salesRoutes = require('./routes/sales')
const supplyRoutes = require('./routes/supplyRoutes')
const importRoutes = require('./routes/importRoutes')
const userRoutes = require('./routes/user')
const { authenticateUser } = require('./middleware/auth')
const Sales = require('./models/Sales')
const app = express()
const fs = require('fs')
const { htmlCreator } = require('./utils/generate')
app.use(
  cors({
    origin: ['http://localhost:5173', 'https://diot-front-tlvk.vercel.app'] // Frontend domeningizni kiriting
  })
)
app.use(bodyParser.json())

// console.log(process.env.NODE_ENV);
const MONGO_URL =
  process.env.NODE_ENV === 'production'
    ? 'mongodb+srv://abbos:uzEgqsSDnf6rTLuq@cluster0.adosdaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    : 'mongodb://127.0.0.1:27017/diot_lampochka_shop'
// MongoDB bilan ulanish
mongoose
  .connect(MONGO_URL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log('MongoDBga ulandik!')
  })
  .catch(err => console.log(err))

app.use('/api', userRoutes)
app.use('/api', authenticateUser(), customerRoutes)
app.use('/api', authenticateUser(), productRoutes)
app.use('/api', authenticateUser(), orderRoutes)
app.use('/api', authenticateUser(), inventoryRoutes)
app.use('/api', authenticateUser(), salesRoutes)
app.use('/api', authenticateUser(), supplyRoutes)
app.use('/api', authenticateUser(), importRoutes)
app.get('/download/:id', async (req, res) => {
  const websiteUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`
  const sale = await Sales.findById(req.params.id)
    .populate('customerId')
    .populate('who')
    .populate({
      path: 'outgoings', // "outgoings"ni bog'lash
      populate: { path: 'productId' } // "outgoings.productId"ni ham bog'lash
    })
  const htmlContent = await htmlCreator(sale, websiteUrl)
  // Set the appropriate headers to prompt the browser to download the file
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=Sotuv-${sale.invoiceId}.pdf`
  )

  // Send the HTML content as the response
  res.send(htmlContent)
})

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi.`)
})
