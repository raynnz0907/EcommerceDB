import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, X } from 'lucide-react';
import { statusBadge, fmt } from '../components/Helpers';
import toast from 'react-hot-toast';

const RETURN_STATUSES = ['requested', 'approved', 'rejected', 'received', 'completed'];

export default function Returns() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [form, setForm] = useState({ order_id: '', order_item_id: '', reason: '' });

  const load = () => {
    setLoading(true);
    API.get('/returns').then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);
  useEffect(() => { if (modal) API.get('/orders', { params: { status: 'delivered' } }).then(r => setOrders(r.data)); }, [modal]);

  const loadItems = async (orderId) => {
    if (!orderId) { setOrderItems([]); return; }
    const r = await API.get(`/orders/${orderId}`);
    setOrderItems(r.data.items);
    setForm(f => ({ ...f, order_id: orderId, order_item_id: '' }));
  };

  const createReturn = async () => {
    if (!form.order_item_id || !form.reason.trim()) return toast.error('Select item and provide reason');
    try {
      await API.post('/returns', { order_item_id: form.order_item_id, reason: form.reason });
      toast.success('Return request submitted'); setModal(false); setForm({ order_id: '', order_item_id: '', reason: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    try { await API.put(`/returns/${id}/status`, { return_status: status }); toast.success('Updated'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Return Requests</h2>
            <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/>New Return</button>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>Return #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Reason</th><th>Status</th><th>Refund</th><th>Update</th></tr></thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={9}><div className="empty-state"><p>No returns yet</p></div></td></tr>
                    : data.map(r => (
                      <tr key={r.return_id}>
                        <td className="font-bold">#{r.return_id}</td>
                        <td>{r.customer_name}</td>
                        <td>{r.product_name}</td>
                        <td>{r.quantity}</td>
                        <td>{fmt(parseFloat(r.unit_price)*r.quantity)}</td>
                        <td style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reason}</td>
                        <td>{statusBadge(r.return_status)}</td>
                        <td>{r.refund_status ? statusBadge(r.refund_status) : <span className="text-muted">—</span>}</td>
                        <td>
                          <select className="filter-select" style={{fontSize:12}} value={r.return_status} onChange={e => updateStatus(r.return_id, e.target.value)}>
                            {RETURN_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
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
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>New Return Request</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Delivered Order *</label>
                <select className="form-control" value={form.order_id} onChange={e => loadItems(e.target.value)}>
                  <option value="">Select order</option>
                  {orders.map(o => <option key={o.order_id} value={o.order_id}>#{o.order_id} — {o.customer_name}</option>)}
                </select>
              </div>
              {orderItems.length > 0 && (
                <div className="form-group"><label className="form-label">Order Item *</label>
                  <select className="form-control" value={form.order_item_id} onChange={e => setForm(f => ({...f, order_item_id: e.target.value}))}>
                    <option value="">Select item</option>
                    {orderItems.map(i => <option key={i.order_item_id} value={i.order_item_id}>{i.product_name} (qty: {i.quantity})</option>)}
                  </select>
                </div>
              )}
              <div className="form-group"><label className="form-label">Reason *</label>
                <textarea className="form-control" rows={3} value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))} placeholder="Describe the return reason…"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createReturn}>Submit Return</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
