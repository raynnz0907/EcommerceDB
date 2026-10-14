const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET dashboard summary stats
router.get('/dashboard', async (req, res) => {
  try {
    const [customers, orders, revenue, products, returns, refunds] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM customers'),
      pool.query('SELECT COUNT(*) AS count FROM orders'),
      pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE payment_status='paid'"),
      pool.query('SELECT COUNT(*) AS count FROM products'),
      pool.query('SELECT COUNT(*) AS count FROM returns'),
      pool.query("SELECT COALESCE(SUM(refund_amount),0) AS total FROM refunds WHERE refund_status='processed'"),
    ]);
    res.json({
      total_customers: parseInt(customers.rows[0].count),
      total_orders: parseInt(orders.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      total_products: parseInt(products.rows[0].count),
      total_returns: parseInt(returns.rows[0].count),
      total_refunds: parseFloat(refunds.rows[0].total),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order status breakdown
router.get('/order-status', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT status, COUNT(*) AS count
      FROM orders GROUP BY status ORDER BY count DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET top selling products
router.get('/top-products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.product_name, p.price,
             SUM(oi.quantity) AS units_sold,
             SUM(oi.quantity * oi.unit_price) AS revenue,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating
      FROM order_items oi
      JOIN products p ON oi.product_id = p.product_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY p.product_id, p.product_name, p.price
      ORDER BY revenue DESC LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET stock report
router.get('/stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.product_code, p.product_name, p.price,
             c.category_name, s.seller_name,
             COALESCE(i.stock_quantity, 0) AS stock_quantity,
             i.updated_at AS last_updated
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      JOIN sellers s ON p.seller_id = s.seller_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      ORDER BY stock_quantity ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET seller performance
router.get('/seller-performance', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.seller_id, s.seller_name, s.email,
             COUNT(DISTINCT p.product_id) AS total_products,
             COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS total_revenue,
             COUNT(DISTINCT o.order_id) AS total_orders,
             COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) AS avg_rating
      FROM sellers s
      LEFT JOIN products p ON s.seller_id = p.seller_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY s.seller_id, s.seller_name, s.email
      ORDER BY total_revenue DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET returns & refunds summary
router.get('/returns-refunds', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.return_id, r.return_status, r.reason, r.return_date,
             p.product_name, c.full_name AS customer_name,
             oi.quantity, oi.unit_price,
             ref.refund_amount, ref.refund_status
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

// GET revenue by month
router.get('/revenue', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT TO_CHAR(o.order_date, 'YYYY-MM') AS month,
             SUM(p.amount) AS revenue,
             COUNT(o.order_id) AS orders
      FROM orders o
      JOIN payments p ON o.order_id = p.order_id
      WHERE p.payment_status = 'paid'
      GROUP BY month ORDER BY month
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
