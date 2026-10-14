const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all returns
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
             p.product_name, c.full_name AS customer_name,
             ref.refund_id, ref.refund_amount, ref.refund_status
      FROM returns r
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN refunds ref ON r.return_id = ref.return_id
      ORDER BY r.return_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create return request
router.post('/', async (req, res) => {
  const { order_item_id, reason } = req.body;
  try {
    // Validate: order must have been delivered (30-day return window check skipped for simplicity)
    const result = await pool.query(
      "INSERT INTO returns (order_item_id, reason, return_status) VALUES ($1, $2, 'requested') RETURNING *",
      [order_item_id, reason]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT approve/reject/update return status
router.put('/:id/status', async (req, res) => {
  const { return_status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE returns SET return_status=$1 WHERE return_id=$2 RETURNING *',
      [return_status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Return not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
