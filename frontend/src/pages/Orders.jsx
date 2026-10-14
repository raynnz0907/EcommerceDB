import { useEffect, useState } from 'react';
import API from '../api';
import { Eye, X, ChevronDown } from 'lucide-react';
import { statusBadge, fmt } from '../components/Helpers';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/orders', { params: { status: filterStatus || undefined } })
      .then(r => setOrders(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filterStatus]);

  const viewOrder = (id) => {
    setDetailLoading(true);
    setDetail({ order: null, items: [] });
    API.get(`/orders/${id}`).then(r => setDetail(r.data)).finally(() => setDetailLoading(false));
  };

  const updateStatus = async (orderId, status) => {
    try {
      await API.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      load();
      if (detail?.order?.order_id === orderId) viewOrder(orderId);
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <>
      <div className="page-content">
        <div className="card">
          <div className="card-header">
            <h2>Orders</h2>
            <div className="flex-gap">
              <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="table-wrap">
            {loading ? <div className="spinner"/> :
              <table>
                <thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th>Status</th><th>Payment</th><th>Amount</th><th>Shipment</th><th>Actions</th></tr></thead>
                <tbody>
                  {orders.length === 0
                    ? <tr><td colSpan={8}><div className="empty-state"><p>No orders found</p></div></td></tr>
                    : orders.map(o => (
                      <tr key={o.order_id}>
                        <td className="font-bold">#{o.order_id}</td>
                        <td>{o.customer_name}</td>
                        <td className="text-muted">{new Date(o.order_date).toLocaleDateString()}</td>
                        <td>{statusBadge(o.status)}</td>
                        <td>{statusBadge(o.payment_status)}</td>
                        <td>{o.payment_amount ? fmt(o.payment_amount) : '—'}</td>
                        <td>{o.tracking_number ? <span className="tag">{o.tracking_number}</span> : <span className="text-muted">—</span>}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-outline btn-sm" onClick={() => viewOrder(o.order_id)}><Eye size={13}/></button>
                            <select
                              className="filter-select"
                              style={{fontSize:12,padding:'4px 8px'}}
                              value={o.status}
                              onChange={e => updateStatus(o.order_id, e.target.value)}
                            >
                              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
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

      {/* Order Detail Modal */}
      {detail && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setDetail(null)}>
          <div className="modal" style={{maxWidth:620}}>
            <div className="modal-header">
              <h3>Order #{detail.order?.order_id} Details</h3>
              <button className="modal-close" onClick={() => setDetail(null)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {detailLoading ? <div className="spinner"/> : !detail.order ? null : (
                <>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    <div><div className="form-label">Customer</div><strong>{detail.order.customer_name}</strong></div>
                    <div><div className="form-label">Order Date</div>{new Date(detail.order.order_date).toLocaleString()}</div>
                    <div><div className="form-label">Order Status</div>{statusBadge(detail.order.status)}</div>
                    <div><div className="form-label">Payment</div>{statusBadge(detail.order.payment_status)} — {detail.order.payment_method}</div>
                    {detail.order.tracking_number && <>
                      <div><div className="form-label">Tracking #</div><span className="tag">{detail.order.tracking_number}</span></div>
                      <div><div className="form-label">Carrier</div>{detail.order.carrier || '—'}</div>
                      <div><div className="form-label">Shipment</div>{statusBadge(detail.order.shipment_status)}</div>
                    </>}
                  </div>
                  <div className="card-header" style={{padding:'10px 0',marginBottom:10}}><strong>Order Items</strong></div>
                  <table>
                    <thead><tr><th>Product</th><th>Code</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                    <tbody>
                      {detail.items.map(i => (
                        <tr key={i.order_item_id}>
                          <td>{i.product_name}</td>
                          <td><span className="tag">{i.product_code}</span></td>
                          <td>{i.quantity}</td>
                          <td>{fmt(i.unit_price)}</td>
                          <td>{fmt(parseFloat(i.unit_price)*i.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex-between" style={{marginTop:12,fontWeight:700,fontSize:15}}>
                    <span>Total</span><span>{fmt(detail.order.payment_amount)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
