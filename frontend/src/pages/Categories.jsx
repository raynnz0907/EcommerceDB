import { useEffect, useState } from 'react';
import API from '../api';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Categories() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category_name: '', description: '' });

  const load = () => { setLoading(true); API.get('/categories').then(r => setData(r.data)).finally(() => setLoading(false)); };
  useEffect(load, []);

  const open = (row = null) => { setEditing(row); setForm(row || { category_name: '', description: '' }); setModal(true); };
  const close = () => { setModal(false); setEditing(null); };
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.category_name.trim()) return toast.error('Category name required');
    try {
      if (editing) { await API.put(`/categories/${editing.category_id}`, form); toast.success('Updated'); }
      else { await API.post('/categories', form); toast.success('Created'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this category?')) return;
    try { await API.delete(`/categories/${id}`); toast.success('Deleted'); load(); }
    catch (err) { toast.error('Cannot delete — products may be linked'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Categories</h2>
            <button className="btn btn-primary" onClick={() => open()}><Plus size={15}/>Add Category</button>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>#</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.map(c => (
                    <tr key={c.category_id}>
                      <td className="text-muted">{c.category_id}</td>
                      <td className="font-bold">{c.category_name}</td>
                      <td>{c.description || '—'}</td>
                      <td>
                        <div className="action-btns">
                          <button className="btn btn-outline btn-sm" onClick={() => open(c)}><Pencil size={13}/></button>
                          <button className="btn btn-danger btn-sm" onClick={() => del(c.category_id)}><Trash2 size={13}/></button>
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
              <h3>{editing ? 'Edit Category' : 'Add Category'}</h3>
              <button className="modal-close" onClick={close}><X size={18}/></button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Category Name *</label>
                <input className="form-control" name="category_name" value={form.category_name} onChange={change}/></div>
              <div className="form-group"><label className="form-label">Description</label>
                <textarea className="form-control" name="description" rows={3} value={form.description||''} onChange={change}/></div>
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
