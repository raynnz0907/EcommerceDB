const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all refunds
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT ref.*, r.reason, r.return_status,
             oi.product_id, oi.unit_price, oi.quantity,
             p.product_name, c.full_name AS customer_name
      FROM refunds ref
      JOIN returns r ON ref.return_id = r.return_id
      JOIN order_items oi ON r.order_item_id = oi.order_item_id
      JOIN products p ON oi.product_id = p.product_id
      JOIN orders o ON oi.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY ref.refund_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST process refund for an approved return
router.post('/', async (req, res) => {
  const { return_id, refund_amount } = req.body;
  try {
    // Validate: refund amount must not exceed paid amount
    const paymentResult = await pool.query(`
      SELECT p.amount FROM payments p
      JOIN orders o ON p.order_id = o.order_id
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN returns r ON oi.order_item_id = r.order_item_id
      WHERE r.return_id = $1
    `, [return_id]);
    const paidAmount = paymentResult.rows[0]?.amount || 0;
    if (parseFloat(refund_amount) > parseFloat(paidAmount)) {
      return res.status(400).json({ error: `Refund amount exceeds paid amount (\$${paidAmount})` });
    }

    const result = await pool.query(
      "INSERT INTO refunds (return_id, refund_amount, refund_status, refund_date) VALUES ($1,$2,'processed',CURRENT_TIMESTAMP) RETURNING *",
      [return_id, refund_amount]
    );

    // Update payment status to refunded
    await pool.query(`
      UPDATE payments SET payment_status='refunded'
      WHERE order_id = (
        SELECT o.order_id FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN returns r ON oi.order_item_id = r.order_item_id
        WHERE r.return_id = $1
      )
    `, [return_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update refund status
router.put('/:id/status', async (req, res) => {
  const { refund_status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE refunds SET refund_status=$1, refund_date=CASE WHEN $1='processed' THEN CURRENT_TIMESTAMP ELSE refund_date END WHERE refund_id=$2 RETURNING *",
      [refund_status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Refund not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
