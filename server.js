// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const inventoryRoutes = require('./routes/inventory');
const salesRoutes = require('./routes/sales');
const app = express();
app.use(cors({
    origin: ['http://localhost:5173', "https://diot-front-tlvk.vercel.app"], // Frontend domeningizni kiriting
}));
app.use(bodyParser.json());

// MongoDB bilan ulanish
mongoose.connect('mongodb+srv://abbos:uzEgqsSDnf6rTLuq@cluster0.adosdaq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDBga ulandik!");
}).catch(err => console.log(err));



app.use('/api', customerRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', inventoryRoutes);
app.use('/api', salesRoutes);
// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server ${PORT}-portda ishga tushdi.`);
});
