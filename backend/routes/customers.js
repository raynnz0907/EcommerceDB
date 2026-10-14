const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all customers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY customer_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single customer
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE customer_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create customer
router.post('/', async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (full_name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [full_name, email, phone, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update customer
router.put('/:id', async (req, res) => {
  const { full_name, email, phone, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET full_name=$1, email=$2, phone=$3, address=$4 WHERE customer_id=$5 RETURNING *',
      [full_name, email, phone, address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE customer_id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ message: 'Customer deleted', customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
