import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, X } from 'lucide-react';
import { statusBadge, fmt } from '../components/Helpers';
import toast from 'react-hot-toast';

export default function Refunds() {
  const [data, setData] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ return_id: '', refund_amount: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/refunds'),
      API.get('/returns'),
    ]).then(([rf, rt]) => {
      setData(rf.data);
      // Only show approved returns without a refund yet
      const refunded = new Set(rf.data.map(r => r.return_id));
      setReturns(rt.data.filter(r => r.return_status === 'approved' && !refunded.has(r.return_id)));
    }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const processRefund = async () => {
    if (!form.return_id || !form.refund_amount) return toast.error('Select return and enter amount');
    try {
      await API.post('/refunds', form);
      toast.success('Refund processed'); setModal(false); setForm({ return_id: '', refund_amount: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Refunds</h2>
            <button className="btn btn-success" onClick={() => setModal(true)}><Plus size={15}/>Process Refund</button>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>Refund #</th><th>Customer</th><th>Product</th><th>Refund Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={6}><div className="empty-state"><p>No refunds processed yet</p></div></td></tr>
                    : data.map(r => (
                      <tr key={r.refund_id}>
                        <td className="font-bold">#{r.refund_id}</td>
                        <td>{r.customer_name}</td>
                        <td>{r.product_name}</td>
                        <td><strong>{fmt(r.refund_amount)}</strong></td>
                        <td>{statusBadge(r.refund_status)}</td>
                        <td className="text-muted">{r.refund_date ? new Date(r.refund_date).toLocaleDateString() : '—'}</td>
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
              <h3>Process Refund</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {returns.length === 0 ? (
                <p className="text-muted" style={{textAlign:'center',padding:'16px 0'}}>No approved returns available for refund. Approve a return first.</p>
              ) : (
                <>
                  <div className="form-group"><label className="form-label">Approved Return *</label>
                    <select className="form-control" value={form.return_id} onChange={e => setForm(f => ({...f, return_id: e.target.value}))}>
                      <option value="">Select return</option>
                      {returns.map(r => <option key={r.return_id} value={r.return_id}>
                        Return #{r.return_id} — {r.customer_name} — {r.product_name}
                      </option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Refund Amount (₹) *</label>
                    <input className="form-control" type="number" min="0.01" step="0.01" value={form.refund_amount} onChange={e => setForm(f => ({...f, refund_amount: e.target.value}))} placeholder="Enter amount"/></div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              {returns.length > 0 && <button className="btn btn-success" onClick={processRefund}>Process Refund</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
