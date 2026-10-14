const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY category_name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create category
router.post('/', async (req, res) => {
  const { category_name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES ($1, $2) RETURNING *',
      [category_name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update category
router.put('/:id', async (req, res) => {
  const { category_name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET category_name=$1, description=$2 WHERE category_id=$3 RETURNING *',
      [category_name, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE category
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM categories WHERE category_id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
