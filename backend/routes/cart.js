const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET cart for a customer (active cart with items)
router.get('/customer/:customerId', async (req, res) => {
  try {
    const cartResult = await pool.query(
      "SELECT * FROM carts WHERE customer_id=$1 AND status='active' ORDER BY created_at DESC LIMIT 1",
      [req.params.customerId]
    );
    if (cartResult.rows.length === 0) return res.json({ cart: null, items: [] });
    const cart = cartResult.rows[0];
    const itemsResult = await pool.query(`
      SELECT ci.cart_id, ci.product_id, ci.quantity,
             p.product_name, p.price, p.product_code,
             COALESCE(i.stock_quantity, 0) AS stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE ci.cart_id = $1
    `, [cart.cart_id]);
    res.json({ cart, items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add item to cart (creates cart if none active)
router.post('/add', async (req, res) => {
  const { customer_id, product_id, quantity } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check stock
    const stockResult = await client.query(
      'SELECT stock_quantity FROM inventory WHERE product_id=$1',
      [product_id]
    );
    const stock = stockResult.rows[0]?.stock_quantity || 0;
    if (stock < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient stock. Available: ${stock}` });
    }

    // Get or create active cart
    let cartResult = await client.query(
      "SELECT * FROM carts WHERE customer_id=$1 AND status='active' LIMIT 1",
      [customer_id]
    );
    let cart;
    if (cartResult.rows.length === 0) {
      const newCart = await client.query(
        "INSERT INTO carts (customer_id, status) VALUES ($1, 'active') RETURNING *",
        [customer_id]
      );
      cart = newCart.rows[0];
    } else {
      cart = cartResult.rows[0];
    }

    // Upsert cart item
    await client.query(`
      INSERT INTO cart_items (cart_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (cart_id, product_id) DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity
    `, [cart.cart_id, product_id, quantity]);

    await client.query('COMMIT');
    res.json({ message: 'Item added to cart', cart_id: cart.cart_id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT update item quantity
router.put('/item', async (req, res) => {
  const { cart_id, product_id, quantity } = req.body;
  try {
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2', [cart_id, product_id]);
      return res.json({ message: 'Item removed from cart' });
    }
    const result = await pool.query(
      'UPDATE cart_items SET quantity=$1 WHERE cart_id=$2 AND product_id=$3 RETURNING *',
      [quantity, cart_id, product_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove item from cart
router.delete('/item/:cartId/:productId', async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE cart_id=$1 AND product_id=$2', [req.params.cartId, req.params.productId]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST checkout — create order from cart
router.post('/checkout', async (req, res) => {
  const { customer_id, payment_method } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get active cart
    const cartResult = await client.query(
      "SELECT * FROM carts WHERE customer_id=$1 AND status='active' LIMIT 1",
      [customer_id]
    );
    if (cartResult.rows.length === 0) throw new Error('No active cart found');
    const cart = cartResult.rows[0];

    // Get cart items
    const itemsResult = await client.query(`
      SELECT ci.product_id, ci.quantity, p.price, i.stock_quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.product_id
      LEFT JOIN inventory i ON p.product_id = i.product_id
      WHERE ci.cart_id = $1
    `, [cart.cart_id]);
    if (itemsResult.rows.length === 0) throw new Error('Cart is empty');

    // Validate stock for all items
    for (const item of itemsResult.rows) {
      if (item.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ID ${item.product_id}`);
      }
    }

    // Create order
    const orderResult = await client.query(
      "INSERT INTO orders (customer_id, status) VALUES ($1, 'placed') RETURNING *",
      [customer_id]
    );
    const order = orderResult.rows[0];

    // Insert order items & deduct stock
    let totalAmount = 0;
    for (const item of itemsResult.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [order.order_id, item.product_id, item.quantity, item.price]
      );
      await client.query(
        'UPDATE inventory SET stock_quantity = stock_quantity - $1, updated_at=CURRENT_TIMESTAMP WHERE product_id=$2',
        [item.quantity, item.product_id]
      );
      totalAmount += parseFloat(item.price) * item.quantity;
    }

    // Create payment record
    await client.query(
      "INSERT INTO payments (order_id, amount, payment_method, payment_status) VALUES ($1,$2,$3,'paid')",
      [order.order_id, totalAmount, payment_method || 'online']
    );

    // Mark cart as checked out
    await client.query("UPDATE carts SET status='checked_out' WHERE cart_id=$1", [cart.cart_id]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Order placed successfully', order_id: order.order_id, total: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
