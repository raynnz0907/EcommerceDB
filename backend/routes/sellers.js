const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all sellers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sellers ORDER BY seller_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller with product count
router.get('/performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.seller_id, s.seller_name, s.email,
             COUNT(DISTINCT p.product_id) AS total_products,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
             COUNT(DISTINCT o.order_id) AS total_orders
      FROM sellers s
      LEFT JOIN products p ON s.seller_id = p.seller_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      GROUP BY s.seller_id, s.seller_name, s.email
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single seller
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sellers WHERE seller_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Seller not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create seller
router.post('/', async (req, res) => {
  const { seller_name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO sellers (seller_name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [seller_name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update seller
router.put('/:id', async (req, res) => {
  const { seller_name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE sellers SET seller_name=$1, email=$2, phone=$3 WHERE seller_id=$4 RETURNING *',
      [seller_name, email, phone, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Seller not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
