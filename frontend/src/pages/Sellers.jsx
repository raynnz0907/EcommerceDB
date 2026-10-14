import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { fmt } from '../components/Helpers';

const empty = { seller_name: '', email: '', phone: '' };

export default function Sellers() {
  const [data, setData] = useState([]);
  const [perf, setPerf] = useState([]);
  const [tab, setTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/sellers'),
      API.get('/reports/seller-performance'),
    ]).then(([s, p]) => { setData(s.data); setPerf(p.data); }).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const open = (row = null) => { setEditing(row); setForm(row || empty); setModal(true); };
  const close = () => { setModal(false); setEditing(null); setForm(empty); };
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.seller_name.trim() || !form.email.trim()) return toast.error('Name and email required');
    try {
      if (editing) { await API.put(`/sellers/${editing.seller_id}`, form); toast.success('Seller updated'); }
      else { await API.post('/sellers', form); toast.success('Seller created'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="page-tabs">
          <button className={`page-tab${tab==='list'?' active':''}`} onClick={()=>setTab('list')}>Seller List</button>
          <button className={`page-tab${tab==='perf'?' active':''}`} onClick={()=>setTab('perf')}>Performance Report</button>
        </div>

        {tab === 'list' && (
          <div className="card">
            <div className="card-header">
              <h2>Sellers</h2>
              <button className="btn btn-primary" onClick={() => open()}><Plus size={15}/>Add Seller</button>
            </div>
            <div className="table-wrap">
              {loading ? <div className="spinner" /> :
                <table>
                  <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.map(s => (
                      <tr key={s.seller_id}>
                        <td className="text-muted">{s.seller_id}</td>
                        <td className="font-bold">{s.seller_name}</td>
                        <td>{s.email}</td>
                        <td>{s.phone || '—'}</td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => open(s)}><Pencil size={13}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        )}

        {tab === 'perf' && (
          <div className="card">
            <div className="card-header"><h2>Seller Performance</h2></div>
            <div className="table-wrap">
              {loading ? <div className="spinner" /> :
                <table>
                  <thead><tr><th>Seller</th><th>Products</th><th>Orders</th><th>Revenue</th><th>Avg Rating</th></tr></thead>
                  <tbody>
                    {perf.map(s => (
                      <tr key={s.seller_id}>
                        <td><div className="font-bold">{s.seller_name}</div><div className="text-sm text-muted">{s.email}</div></td>
                        <td>{s.total_products}</td>
                        <td>{s.total_orders}</td>
                        <td>{fmt(s.total_revenue)}</td>
                        <td>⭐ {s.avg_rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              }
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editing ? 'Edit Seller' : 'Add Seller'}</h3>
              <button className="modal-close" onClick={close}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Seller Name *</label>
                <input className="form-control" name="seller_name" value={form.seller_name} onChange={change} /></div>
              <div className="form-group"><label className="form-label">Email *</label>
                <input className="form-control" name="email" type="email" value={form.email} onChange={change} /></div>
              <div className="form-group"><label className="form-label">Phone</label>
                <input className="form-control" name="phone" value={form.phone||''} onChange={change} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={close}>Cancel</button>
              <button className="btn btn-primary" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
