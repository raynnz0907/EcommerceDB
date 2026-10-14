import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmt } from '../components/Helpers';

const emptyProd = { seller_id: '', category_id: '', product_code: '', product_name: '', description: '', price: '', stock_quantity: 0 };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyProd);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/products', { params: { search: search || undefined, category: filterCat || undefined } }),
      API.get('/categories'),
      API.get('/sellers'),
    ]).then(([p, c, s]) => { setProducts(p.data); setCategories(c.data); setSellers(s.data); }).finally(() => setLoading(false));
  };

  useEffect(load, [search, filterCat]);

  const open = (row = null) => {
    setEditing(row);
    setForm(row ? { ...row, stock_quantity: row.stock_quantity } : emptyProd);
    setModal(true);
  };
  const close = () => { setModal(false); setEditing(null); setForm(emptyProd); };
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.product_name || !form.product_code || !form.price || !form.seller_id || !form.category_id)
      return toast.error('Fill all required fields');
    setSaving(true);
    try {
      if (editing) { await API.put(`/products/${editing.product_id}`, form); toast.success('Product updated'); }
      else { await API.post('/products', form); toast.success('Product created'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await API.delete(`/products/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Products</h2>
            <div className="flex-gap">
              <div className="search-input-wrap">
                <Search size={14}/>
                <input className="search-input" placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="filter-select" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
              </select>
              <button className="btn btn-primary" onClick={() => open()}><Plus size={15}/>Add Product</button>
            </div>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>Code</th><th>Name</th><th>Category</th><th>Seller</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead>
                <tbody>
                  {products.length === 0
                    ? <tr><td colSpan={8}><div className="empty-state"><p>No products found</p></div></td></tr>
                    : products.map(p => (
                      <tr key={p.product_id}>
                        <td><span className="tag">{p.product_code}</span></td>
                        <td><div className="font-bold">{p.product_name}</div><div className="text-sm text-muted" style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.description}</div></td>
                        <td>{p.category_name}</td>
                        <td>{p.seller_name}</td>
                        <td>{fmt(p.price)}</td>
                        <td>
                          <span className={`badge ${p.stock_quantity === 0 ? 'badge-red' : p.stock_quantity < 5 ? 'badge-yellow' : 'badge-green'}`}>
                            {p.stock_quantity}
                          </span>
                        </td>
                        <td>⭐ {p.avg_rating} <span className="text-muted text-sm">({p.review_count})</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-outline btn-sm" onClick={() => open(p)}><Pencil size={13}/></button>
                            <button className="btn btn-danger btn-sm" onClick={() => del(p.product_id)}><Trash2 size={13}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={close}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Code *</label>
                  <input className="form-control" name="product_code" value={form.product_code} onChange={change} placeholder="PROD-001"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input className="form-control" name="price" type="number" min="0" step="0.01" value={form.price} onChange={change}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input className="form-control" name="product_name" value={form.product_name} onChange={change}/>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Seller *</label>
                  <select className="form-control" name="seller_id" value={form.seller_id} onChange={change}>
                    <option value="">Select seller</option>
                    {sellers.map(s => <option key={s.seller_id} value={s.seller_id}>{s.seller_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-control" name="category_id" value={form.category_id} onChange={change}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" name="description" rows={2} value={form.description||''} onChange={change}/>
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input className="form-control" name="stock_quantity" type="number" min="0" value={form.stock_quantity} onChange={change}/>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
