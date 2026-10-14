import { useEffect, useState } from 'react';
import API from '../api';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmt } from '../components/Helpers';

export default function Cart() {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    Promise.all([API.get('/customers'), API.get('/products')]).then(([c, p]) => {
      setCustomers(c.data); setProducts(p.data);
    });
  }, []);

  const loadCart = (id) => {
    if (!id) return;
    setLoading(true);
    API.get(`/cart/customer/${id}`).then(r => { setCart(r.data.cart); setItems(r.data.items); }).finally(() => setLoading(false));
  };

  const handleCustomer = (e) => { setCustomerId(e.target.value); setCart(null); setItems([]); loadCart(e.target.value); };

  const addToCart = async (productId) => {
    if (!customerId) return toast.error('Select a customer first');
    try {
      await API.post('/cart/add', { customer_id: customerId, product_id: productId, quantity: 1 });
      toast.success('Added to cart'); loadCart(customerId);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const updateQty = async (productId, qty) => {
    if (!cart) return;
    try {
      await API.put('/cart/item', { cart_id: cart.cart_id, product_id: productId, quantity: qty });
      loadCart(customerId);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const removeItem = async (productId) => {
    if (!cart) return;
    try {
      await API.delete(`/cart/item/${cart.cart_id}/${productId}`);
      toast.success('Removed'); loadCart(customerId);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const checkout = async () => {
    if (!customerId || items.length === 0) return toast.error('Empty cart');
    setChecking(true);
    try {
      const r = await API.post('/cart/checkout', { customer_id: customerId, payment_method: paymentMethod });
      toast.success(`Order #${r.data.order_id} placed! Total: ${fmt(r.data.total)}`);
      setCart(null); setItems([]);
    } catch (err) { toast.error(err.response?.data?.error || 'Checkout failed'); }
    finally { setChecking(false); }
  };

  const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);

  return (
    <div className="page-content">
      <div className="section-grid" style={{ gridTemplateColumns: '1fr 380px' }}>
        {/* Product Catalogue */}
        <div className="card">
          <div className="card-header">
            <h2>Product Catalogue</h2>
            <div>
              <label className="form-label" style={{display:'inline',marginRight:8}}>Customer:</label>
              <select className="filter-select" value={customerId} onChange={handleCustomer}>
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.product_id}>
                    <td>
                      <div className="font-bold">{p.product_name}</div>
                      <div className="text-sm text-muted">{p.category_name}</div>
                    </td>
                    <td>{fmt(p.price)}</td>
                    <td>
                      <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : p.stock_quantity < 5 ? 'badge-yellow' : 'badge-green'}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => addToCart(p.product_id)}
                        disabled={p.stock_quantity === 0}
                      >
                        <Plus size={13}/> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cart */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div className="card-header">
            <h2><ShoppingCart size={16} style={{display:'inline',marginRight:6}}/>Cart</h2>
            {cart && <span className="badge badge-green">{items.length} item(s)</span>}
          </div>
          <div className="card-body">
            {!customerId ? (
              <p className="text-muted" style={{textAlign:'center',padding:'20px 0'}}>Select a customer to see/manage cart</p>
            ) : loading ? <div className="spinner"/> : items.length === 0 ? (
              <p className="text-muted" style={{textAlign:'center',padding:'20px 0'}}>Cart is empty. Add products from the left.</p>
            ) : (
              <>
                {items.map(i => (
                  <div key={i.product_id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                    <div className="flex-between">
                      <div>
                        <div className="font-bold" style={{fontSize:13}}>{i.product_name}</div>
                        <div className="text-sm text-muted">{fmt(i.price)} each</div>
                      </div>
                      <button className="btn btn-danger btn-sm" onClick={() => removeItem(i.product_id)}><Trash2 size={12}/></button>
                    </div>
                    <div className="cart-qty" style={{marginTop:8}}>
                      <button className="qty-btn" onClick={() => updateQty(i.product_id, i.quantity - 1)}><Minus size={12}/></button>
                      <strong style={{minWidth:24,textAlign:'center'}}>{i.quantity}</strong>
                      <button className="qty-btn" onClick={() => updateQty(i.product_id, i.quantity + 1)} disabled={i.quantity >= i.stock_quantity}><Plus size={12}/></button>
                      <span style={{marginLeft:'auto'}}>{fmt(parseFloat(i.price) * i.quantity)}</span>
                    </div>
                  </div>
                ))}
                <div className="flex-between" style={{marginTop:8,marginBottom:16}}>
                  <strong>Total</strong>
                  <strong style={{fontSize:16}}>{fmt(total)}</strong>
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="online">Online</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="cash_on_delivery">Cash on Delivery</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <button className="btn btn-success" style={{width:'100%'}} onClick={checkout} disabled={checking}>
                  <CreditCard size={16}/> {checking ? 'Processing…' : 'Place Order'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
