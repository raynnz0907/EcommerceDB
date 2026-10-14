const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all reviews
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.full_name AS customer_name, p.product_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.customer_id
      JOIN products p ON r.product_id = p.product_id
      ORDER BY r.review_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create review
router.post('/', async (req, res) => {
  const { customer_id, product_id, rating, review_text } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reviews (customer_id, product_id, rating, review_text) VALUES ($1,$2,$3,$4) RETURNING *',
      [customer_id, product_id, rating, review_text]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE review
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reviews WHERE review_id=$1', [req.params.id]);
    res.json({ message: 'Review deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
