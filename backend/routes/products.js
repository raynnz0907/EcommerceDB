const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET all products with category + seller + stock info
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT p.*, c.category_name, s.seller_name,
             COALESCE(i.stock_quantity, 0) AS stock_quantity,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
             COUNT(r.review_id) AS review_count
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      JOIN sellers s ON p.seller_id = s.seller_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
    `;
    const params = [];
    const conditions = [];
    if (category) {
      params.push(category);
      conditions.push(`c.category_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.product_name ILIKE $${params.length} OR p.product_code ILIKE $${params.length})`);
    }
    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' GROUP BY p.product_id, c.category_name, s.seller_name, i.stock_quantity ORDER BY p.product_id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single product
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.category_name, s.seller_name,
             COALESCE(i.stock_quantity, 0) AS stock_quantity,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating,
             COUNT(r.review_id) AS review_count
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      JOIN sellers s ON p.seller_id = s.seller_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.product_id = $1
      GROUP BY p.product_id, c.category_name, s.seller_name, i.stock_quantity
    `, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET reviews for a product
router.get('/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, c.full_name AS customer_name
      FROM reviews r
      JOIN customers c ON r.customer_id = c.customer_id
      WHERE r.product_id = $1
      ORDER BY r.review_date DESC
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create product
router.post('/', async (req, res) => {
  const { seller_id, category_id, product_code, product_name, description, price, stock_quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productResult = await client.query(
      'INSERT INTO products (seller_id, category_id, product_code, product_name, description, price) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [seller_id, category_id, product_code, product_name, description, price]
    );
    const product = productResult.rows[0];
    await client.query(
      'INSERT INTO inventory (product_id, stock_quantity) VALUES ($1, $2)',
      [product.product_id, stock_quantity || 0]
    );
    await client.query('COMMIT');
    res.status(201).json(product);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update product
router.put('/:id', async (req, res) => {
  const { seller_id, category_id, product_code, product_name, description, price, stock_quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE products SET seller_id=$1, category_id=$2, product_code=$3, product_name=$4, description=$5, price=$6 WHERE product_id=$7 RETURNING *',
      [seller_id, category_id, product_code, product_name, description, price, req.params.id]
    );
    if (result.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Product not found' }); }
    if (stock_quantity !== undefined) {
      await client.query(
        'UPDATE inventory SET stock_quantity=$1, updated_at=CURRENT_TIMESTAMP WHERE product_id=$2',
        [stock_quantity, req.params.id]
      );
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

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE product_id=$1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
