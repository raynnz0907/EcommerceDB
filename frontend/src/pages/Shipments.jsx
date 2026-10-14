import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, X, Search } from 'lucide-react';
import { statusBadge } from '../components/Helpers';
import toast from 'react-hot-toast';

const SHIP_STATUSES = ['preparing', 'shipped', 'in_transit', 'delivered', 'returned'];

export default function Shipments() {
  const [data, setData] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [trackModal, setTrackModal] = useState(false);
  const [trackNum, setTrackNum] = useState('');
  const [trackResult, setTrackResult] = useState(null);
  const [form, setForm] = useState({ order_id: '', tracking_number: '', carrier: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/shipments'),
      API.get('/orders', { params: { status: 'placed' } }),
    ]).then(([s, o]) => { setData(s.data); setOrders(o.data); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const createShipment = async () => {
    if (!form.order_id || !form.tracking_number) return toast.error('Order and tracking number required');
    try {
      await API.post('/shipments', form);
      toast.success('Shipment created'); setModal(false); setForm({ order_id: '', tracking_number: '', carrier: '' }); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/shipments/${id}/status`, { shipment_status: status });
      toast.success('Status updated'); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const track = async () => {
    if (!trackNum.trim()) return;
    try {
      const r = await API.get(`/shipments/track/${trackNum}`);
      setTrackResult(r.data);
    } catch { toast.error('Tracking number not found'); setTrackResult(null); }
  };

  return (
    <>
      <div className="page-content">
        {/* Track shipment bar */}
        <div className="card" style={{marginBottom:20}}>
          <div className="card-body" style={{padding:'14px 20px'}}>
            <div className="flex-gap">
              <Search size={16} className="text-muted"/>
              <input className="form-control" style={{maxWidth:300}} placeholder="Enter tracking number…" value={trackNum} onChange={e => setTrackNum(e.target.value)} onKeyDown={e => e.key==='Enter' && track()}/>
              <button className="btn btn-primary" onClick={track}>Track Shipment</button>
            </div>
            {trackResult && (
              <div style={{marginTop:12,background:'var(--bg)',padding:12,borderRadius:8}}>
                <strong>Tracking #{trackResult.tracking_number}</strong>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginTop:8}}>
                  <div><div className="text-muted text-sm">Customer</div>{trackResult.customer_name}</div>
                  <div><div className="text-muted text-sm">Carrier</div>{trackResult.carrier || '—'}</div>
                  <div><div className="text-muted text-sm">Status</div>{statusBadge(trackResult.shipment_status)}</div>
                  {trackResult.shipped_at && <div><div className="text-muted text-sm">Shipped</div>{new Date(trackResult.shipped_at).toLocaleString()}</div>}
                  {trackResult.delivered_at && <div><div className="text-muted text-sm">Delivered</div>{new Date(trackResult.delivered_at).toLocaleString()}</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Shipments</h2>
            <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15}/>Create Shipment</button>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>Tracking #</th><th>Order</th><th>Customer</th><th>Carrier</th><th>Status</th><th>Shipped</th><th>Delivered</th><th>Update</th></tr></thead>
                <tbody>
                  {data.length === 0
                    ? <tr><td colSpan={8}><div className="empty-state"><p>No shipments</p></div></td></tr>
                    : data.map(s => (
                      <tr key={s.shipment_id}>
                        <td><span className="tag">{s.tracking_number}</span></td>
                        <td>#{s.order_id}</td>
                        <td>{s.customer_name}</td>
                        <td>{s.carrier || '—'}</td>
                        <td>{statusBadge(s.shipment_status)}</td>
                        <td className="text-muted">{s.shipped_at ? new Date(s.shipped_at).toLocaleDateString() : '—'}</td>
                        <td className="text-muted">{s.delivered_at ? new Date(s.delivered_at).toLocaleDateString() : '—'}</td>
                        <td>
                          <select className="filter-select" style={{fontSize:12}} value={s.shipment_status} onChange={e => updateStatus(s.shipment_id, e.target.value)}>
                            {SHIP_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
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
              <h3>Create Shipment</h3>
              <button className="modal-close" onClick={() => setModal(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Order *</label>
                <select className="form-control" value={form.order_id} onChange={e => setForm(f => ({...f, order_id: e.target.value}))}>
                  <option value="">Select placed order</option>
                  {orders.map(o => <option key={o.order_id} value={o.order_id}>#{o.order_id} — {o.customer_name}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Tracking Number *</label>
                <input className="form-control" value={form.tracking_number} onChange={e => setForm(f => ({...f, tracking_number: e.target.value}))} placeholder="TRK-001234"/></div>
              <div className="form-group"><label className="form-label">Carrier</label>
                <input className="form-control" value={form.carrier} onChange={e => setForm(f => ({...f, carrier: e.target.value}))} placeholder="BlueDart, DTDC…"/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createShipment}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
