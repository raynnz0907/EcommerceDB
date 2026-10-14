import { useEffect, useState } from 'react';
import API from '../api';
import { fmt } from '../components/Helpers';

export default function Reports() {
  const [tab, setTab] = useState('top-products');
  const [topProducts, setTopProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [sellerPerf, setSellerPerf] = useState([]);
  const [returnsRefunds, setReturnsRefunds] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [orderStatus, setOrderStatus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get('/reports/top-products'),
      API.get('/reports/stock'),
      API.get('/reports/seller-performance'),
      API.get('/reports/returns-refunds'),
      API.get('/reports/revenue'),
      API.get('/reports/order-status'),
    ]).then(([tp, st, sp, rr, rv, os]) => {
      setTopProducts(tp.data); setStock(st.data); setSellerPerf(sp.data);
      setReturnsRefunds(rr.data); setRevenue(rv.data); setOrderStatus(os.data);
    }).finally(() => setLoading(false));
  }, []);

  const statusColors = { placed: '#6366f1', processing: '#f59e0b', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

  if (loading) return <div className="page-content"><div className="spinner"/></div>;

  return (
    <div className="page-content">
      <div className="page-tabs">
        {[['top-products','Top Products'],['stock','Stock Report'],['seller-perf','Seller Performance'],['returns-refunds','Returns & Refunds'],['revenue','Revenue'],['order-status','Order Status']].map(([key, label]) => (
          <button key={key} className={`page-tab${tab===key?' active':''}`} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'top-products' && (
        <div className="card">
          <div className="card-header"><h2>Top Products by Revenue</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Rank</th><th>Product</th><th>Price</th><th>Units Sold</th><th>Revenue</th><th>Avg Rating</th></tr></thead>
              <tbody>
                {topProducts.length === 0
                  ? <tr><td colSpan={6}><div className="empty-state"><p>No sales data yet</p></div></td></tr>
                  : topProducts.map((p, i) => (
                    <tr key={p.product_id}>
                      <td><strong>#{i+1}</strong></td>
                      <td className="font-bold">{p.product_name}</td>
                      <td>{fmt(p.price)}</td>
                      <td>{p.units_sold}</td>
                      <td><strong>{fmt(p.revenue)}</strong></td>
                      <td>⭐ {p.avg_rating}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'stock' && (
        <div className="card">
          <div className="card-header"><h2>Stock / Inventory Report</h2><span className="text-muted text-sm">{stock.length} items</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Code</th><th>Product</th><th>Category</th><th>Seller</th><th>Price</th><th>Qty</th><th>Status</th></tr></thead>
              <tbody>
                {stock.map(p => (
                  <tr key={p.product_id}>
                    <td><span className="tag">{p.product_code}</span></td>
                    <td className="font-bold">{p.product_name}</td>
                    <td>{p.category_name}</td>
                    <td>{p.seller_name}</td>
                    <td>{fmt(p.price)}</td>
                    <td><strong>{p.stock_quantity}</strong></td>
                    <td>
                      {p.stock_quantity === 0 ? <span className="badge badge-red">Out of Stock</span>
                        : p.stock_quantity <= 5 ? <span className="badge badge-yellow">Low Stock</span>
                        : <span className="badge badge-green">In Stock</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'seller-perf' && (
        <div className="card">
          <div className="card-header"><h2>Seller Performance Report</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Seller</th><th>Email</th><th>Products</th><th>Orders</th><th>Revenue</th><th>Avg Rating</th></tr></thead>
              <tbody>
                {sellerPerf.map(s => (
                  <tr key={s.seller_id}>
                    <td className="font-bold">{s.seller_name}</td>
                    <td>{s.email}</td>
                    <td>{s.total_products}</td>
                    <td>{s.total_orders}</td>
                    <td><strong>{fmt(s.total_revenue)}</strong></td>
                    <td>⭐ {s.avg_rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'returns-refunds' && (
        <div className="card">
          <div className="card-header"><h2>Returns & Refunds Report</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Return #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Return Status</th><th>Reason</th><th>Refund</th><th>Refund Status</th></tr></thead>
              <tbody>
                {returnsRefunds.length === 0
                  ? <tr><td colSpan={8}><div className="empty-state"><p>No returns yet</p></div></td></tr>
                  : returnsRefunds.map(r => (
                    <tr key={r.return_id}>
                      <td className="font-bold">#{r.return_id}</td>
                      <td>{r.customer_name}</td>
                      <td>{r.product_name}</td>
                      <td>{r.quantity}</td>
                      <td><span className={`badge ${r.return_status==='approved'?'badge-green':r.return_status==='rejected'?'badge-red':'badge-blue'}`}>{r.return_status}</span></td>
                      <td style={{maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.reason}</td>
                      <td>{r.refund_amount ? fmt(r.refund_amount) : '—'}</td>
                      <td>{r.refund_status ? <span className={`badge ${r.refund_status==='processed'?'badge-green':'badge-yellow'}`}>{r.refund_status}</span> : <span className="text-muted">—</span>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'revenue' && (
        <div className="card">
          <div className="card-header"><h2>Monthly Revenue Report</h2></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Month</th><th>Orders</th><th>Revenue</th></tr></thead>
              <tbody>
                {revenue.length === 0
                  ? <tr><td colSpan={3}><div className="empty-state"><p>No revenue data yet</p></div></td></tr>
                  : revenue.map(r => (
                    <tr key={r.month}>
                      <td className="font-bold">{r.month}</td>
                      <td>{r.orders}</td>
                      <td><strong>{fmt(r.revenue)}</strong></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'order-status' && (
        <div className="card" style={{maxWidth:500}}>
          <div className="card-header"><h2>Order Status Breakdown</h2></div>
          <div className="card-body">
            {orderStatus.map(row => {
              const total = orderStatus.reduce((s, r) => s + parseInt(r.count), 0);
              const pct = total > 0 ? Math.round(parseInt(row.count) / total * 100) : 0;
              return (
                <div key={row.status} style={{marginBottom:14}}>
                  <div className="flex-between" style={{marginBottom:4}}>
                    <span style={{textTransform:'capitalize',fontWeight:500}}>{row.status}</span>
                    <span>{row.count} ({pct}%)</span>
                  </div>
                  <div style={{height:8,background:'var(--border)',borderRadius:4,overflow:'hidden'}}>
                    <div style={{width:`${pct}%`,height:'100%',background:statusColors[row.status]||'#94a3b8',borderRadius:4,transition:'width .4s'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
