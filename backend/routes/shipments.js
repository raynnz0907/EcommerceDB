const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all shipments
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sh.*, o.customer_id, o.status AS order_status, c.full_name AS customer_name
      FROM shipments sh
      JOIN orders o ON sh.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      ORDER BY sh.shipment_id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET shipment by tracking number
router.get('/track/:trackingNumber', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sh.*, o.customer_id, o.status AS order_status, c.full_name AS customer_name
      FROM shipments sh
      JOIN orders o ON sh.order_id = o.order_id
      JOIN customers c ON o.customer_id = c.customer_id
      WHERE sh.tracking_number = $1
    `, [req.params.trackingNumber]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Tracking number not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create shipment for an order
router.post('/', async (req, res) => {
  const { order_id, tracking_number, carrier } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO shipments (order_id, tracking_number, carrier, shipment_status) VALUES ($1,$2,$3,'preparing') RETURNING *",
      [order_id, tracking_number, carrier]
    );
    // Update order status to shipped
    await pool.query("UPDATE orders SET status='shipped' WHERE order_id=$1", [order_id]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update shipment status
router.put('/:id/status', async (req, res) => {
  const { shipment_status } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updates = { shipment_status };
    const extraFields = [];
    if (shipment_status === 'shipped') extraFields.push("shipped_at=CURRENT_TIMESTAMP");
    if (shipment_status === 'delivered') extraFields.push("delivered_at=CURRENT_TIMESTAMP");

    const setClause = [`shipment_status=$1`, ...extraFields].join(', ');
    const result = await client.query(
      `UPDATE shipments SET ${setClause} WHERE shipment_id=$2 RETURNING *`,
      [shipment_status, req.params.id]
    );
    if (result.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Shipment not found' }); }

    // Sync order status
    if (shipment_status === 'delivered') {
      await client.query("UPDATE orders SET status='delivered' WHERE order_id=$1", [result.rows[0].order_id]);
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
