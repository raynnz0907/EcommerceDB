import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Pencil, Trash2, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const empty = { full_name: '', email: '', phone: '', address: '' };

export default function Customers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/customers').then(r => setData(r.data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const open = (row = null) => { setEditing(row); setForm(row || empty); setModal(true); };
  const close = () => { setModal(false); setEditing(null); setForm(empty); };
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.full_name.trim() || !form.email.trim()) return toast.error('Name and email required');
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/customers/${editing.customer_id}`, form);
        toast.success('Customer updated');
      } else {
        await API.post('/customers', form);
        toast.success('Customer created');
      }
      close(); load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error saving');
    } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try { await API.delete(`/customers/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Cannot delete'); }
  };

  const filtered = data.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Customers</h2>
            <div className="flex-gap">
              <div className="search-input-wrap">
                <Search size={14} />
                <input className="search-input" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={() => open()}><Plus size={15}/>Add Customer</button>
            </div>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner" /> :
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><p>No customers found</p></div></td></tr> :
                    filtered.map(c => (
                      <tr key={c.customer_id}>
                        <td className="text-muted">{c.customer_id}</td>
                        <td className="font-bold">{c.full_name}</td>
                        <td>{c.email}</td>
                        <td>{c.phone || '—'}</td>
                        <td>{c.address || '—'}</td>
                        <td className="text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-outline btn-sm" onClick={() => open(c)}><Pencil size={13}/></button>
                            <button className="btn btn-danger btn-sm" onClick={() => del(c.customer_id)}><Trash2 size={13}/></button>
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
              <h3>{editing ? 'Edit Customer' : 'Add Customer'}</h3>
              <button className="modal-close" onClick={close}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" name="full_name" value={form.full_name} onChange={change} placeholder="John Doe"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="form-control" name="email" type="email" value={form.email} onChange={change} placeholder="john@example.com"/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" name="phone" value={form.phone || ''} onChange={change} placeholder="+91 9876543210"/>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" name="address" rows={3} value={form.address || ''} onChange={change} placeholder="Full address"/>
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
