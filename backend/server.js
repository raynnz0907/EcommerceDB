const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/customers', require('./routes/customers'));
app.use('/api/sellers', require('./routes/sellers'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/shipments', require('./routes/shipments'));
app.use('/api/returns', require('./routes/returns'));
app.use('/api/refunds', require('./routes/refunds'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 E-Commerce API running on http://localhost:${PORT}`);
});
