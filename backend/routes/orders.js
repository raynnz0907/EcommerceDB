const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all orders with customer and payment info
router.get('/', async (req, res) => {
  try {
    const { customer_id, status } = req.query;
    let query = `
      SELECT o.*, c.full_name AS customer_name,
             p.amount AS payment_amount, p.payment_method, p.payment_status,
             sh.tracking_number, sh.shipment_status, sh.carrier
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN shipments sh ON o.order_id = sh.order_id
    `;
    const params = [];
    const conditions = [];
    if (customer_id) { params.push(customer_id); conditions.push(`o.customer_id=$${params.length}`); }
    if (status) { params.push(status); conditions.push(`o.status=$${params.length}`); }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY o.order_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single order with items
router.get('/:id', async (req, res) => {
  try {
    const orderResult = await pool.query(`
      SELECT o.*, c.full_name AS customer_name,
             p.amount AS payment_amount, p.payment_method, p.payment_status,
             sh.tracking_number, sh.shipment_status, sh.carrier, sh.shipped_at, sh.delivered_at
      FROM orders o
      JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      LEFT JOIN shipments sh ON o.order_id = sh.order_id
      WHERE o.order_id = $1
    `, [req.params.id]);
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    const itemsResult = await pool.query(`
      SELECT oi.*, p.product_name, p.product_code
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      WHERE oi.order_id = $1
    `, [req.params.id]);

    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update order status
router.put('/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status=$1 WHERE order_id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
