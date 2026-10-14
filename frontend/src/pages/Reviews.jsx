import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Trash2, X } from 'lucide-react';
import { Stars, fmt } from '../components/Helpers';
import toast from 'react-hot-toast';

export default function Reviews() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ customer_id: '', product_id: '', rating: 5, review_text: '' });

  const load = () => {
    setLoading(true);
    API.get('/reviews').then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => {
    if (modal) {
      Promise.all([API.get('/customers'), API.get('/products')]).then(([c, p]) => { setCustomers(c.data); setProducts(p.data); });
    }
  }, [modal]);

  const save = async () => {
    if (!form.customer_id || !form.product_id) return toast.error('Select customer and product');
    try {
      await API.post('/reviews', form);
      toast.success('Review added'); setModal(false); setForm({ customer_id: '', product_id: '', rating: 5, review_text: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete review?')) return;
    try { await API.delete(`/reviews/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Error'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Customer Reviews</h2>
            <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/>Add Review</button>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>#</th><th>Customer</th><th>Product</th><th>Rating</th><th>Review</th><th>Date</th><th></th></tr></thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={7}><div className="empty-state"><p>No reviews yet</p></div></td></tr>
                    : data.map(r => (
                      <tr key={r.review_id}>
                        <td className="text-muted">{r.review_id}</td>
                        <td className="font-bold">{r.customer_name}</td>
                        <td>{r.product_name}</td>
                        <td><Stars rating={r.rating}/></td>
                        <td style={{maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.review_text || '—'}</td>
                        <td className="text-muted">{new Date(r.review_date).toLocaleDateString()}</td>
                        <td><button className="btn btn-danger btn-sm" onClick={() => del(r.review_id)}><Trash2 size={13}/></button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            }
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Add Review</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Customer *</label>
                  <select className="form-control" value={form.customer_id} onChange={e => setForm(f => ({...f, customer_id: e.target.value}))}>
                    <option value="">Select</option>
                    {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Product *</label>
                  <select className="form-control" value={form.product_id} onChange={e => setForm(f => ({...f, product_id: e.target.value}))}>
                    <option value="">Select</option>
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Rating (1–5) *</label>
                <div style={{display:'flex',gap:8,marginTop:4}}>
                  {[1,2,3,4,5].map(i => (
                    <button key={i} style={{fontSize:22,background:'none',border:'none',cursor:'pointer',color: i <= form.rating ? '#f59e0b' : '#cbd5e1'}}
                      onClick={() => setForm(f => ({...f, rating: i}))}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group"><label className="form-label">Review Text</label>
                <textarea className="form-control" rows={3} value={form.review_text} onChange={e => setForm(f => ({...f, review_text: e.target.value}))} placeholder="Write your review…"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Submit Review</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
