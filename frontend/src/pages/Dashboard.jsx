import { useEffect, useState } from 'react';
import API from '../api';
import { Users, ShoppingBag, DollarSign, Package, RotateCcw, TrendingDown } from 'lucide-react';
import { fmt } from '../components/Helpers';

function StatCard({ icon: Icon, label, value, colorClass }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${colorClass}`}><Icon size={22} /></div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orderStatus, setOrderStatus] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/reports/dashboard'),
      API.get('/reports/order-status'),
      API.get('/reports/top-products'),
    ]).then(([s, o, p]) => {
      setStats(s.data);
      setOrderStatus(o.data);
      setTopProducts(p.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-content"><div className="spinner" /></div>;

  const statusColors = { placed: '#6366f1', processing: '#f59e0b', shipped: '#8b5cf6', delivered: '#10b981', cancelled: '#ef4444' };

  return (
    <div className="page-content">
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon={Users} label="Total Customers" value={stats.total_customers} colorClass="purple" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total_orders} colorClass="blue" />
        <StatCard icon={DollarSign} label="Total Revenue" value={fmt(stats.total_revenue)} colorClass="green" />
        <StatCard icon={Package} label="Total Products" value={stats.total_products} colorClass="orange" />
        <StatCard icon={RotateCcw} label="Total Returns" value={stats.total_returns} colorClass="red" />
        <StatCard icon={TrendingDown} label="Refunds Issued" value={fmt(stats.total_refunds)} colorClass="teal" />
      </div>

      <div className="section-grid">
        {/* Order Status Breakdown */}
        <div className="card">
          <div className="card-header"><h2>Order Status Breakdown</h2></div>
          <div className="card-body">
            {orderStatus.length === 0 ? <p className="text-muted">No orders yet.</p> :
              orderStatus.map(row => (
                <div key={row.status} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: statusColors[row.status] || '#94a3b8' }} />
                  <span style={{ flex: 1, textTransform: 'capitalize' }}>{row.status}</span>
                  <strong>{row.count}</strong>
                </div>
              ))
            }
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header"><h2>Top Products by Revenue</h2></div>
          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Units</th><th>Revenue</th></tr></thead>
                <tbody>
                  {topProducts.length === 0
                    ? <tr><td colSpan={3} className="empty-state"><p>No sales data</p></td></tr>
                    : topProducts.map(p => (
                      <tr key={p.product_id}>
                        <td><div className="font-bold">{p.product_name}</div><div className="text-sm text-muted">{fmt(p.price)} each</div></td>
                        <td>{p.units_sold}</td>
                        <td>{fmt(p.revenue)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
