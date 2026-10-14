import { useEffect, useState } from 'react';
import API from '../api';
import { fmt } from '../components/Helpers';

export default function Inventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/reports/stock').then(r => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const lowStock = data.filter(d => d.stock_quantity <= 5);

  return (
    <div className="page-content">
      {lowStock.length > 0 && (
        <div style={{ background:'#fee2e2', border:'1px solid #fca5a5', borderRadius:10, padding:'12px 16px', marginBottom:16, color:'#991b1b', fontWeight:500 }}>
          ⚠️ {lowStock.length} product(s) with low stock (≤ 5 units). Go to Products to update stock.
        </div>
      )}
      <div className="card">
        <div className="card-header"><h2>Stock Report</h2><span className="text-muted text-sm">{data.length} products</span></div>
        <div className="table-wrap">
          {loading ? <div className="spinner"/> :
            <table>
              <thead><tr><th>Code</th><th>Product</th><th>Category</th><th>Seller</th><th>Price</th><th>Stock</th><th>Status</th><th>Last Updated</th></tr></thead>
              <tbody>
                {data.map(p => (
                  <tr key={p.product_id}>
                    <td><span className="tag">{p.product_code}</span></td>
                    <td className="font-bold">{p.product_name}</td>
                    <td>{p.category_name}</td>
                    <td>{p.seller_name}</td>
                    <td>{fmt(p.price)}</td>
                    <td><strong>{p.stock_quantity}</strong></td>
                    <td>
                      {p.stock_quantity === 0
                        ? <span className="badge badge-red">Out of Stock</span>
                        : p.stock_quantity <= 5
                        ? <span className="badge badge-yellow">Low Stock</span>
                        : <span className="badge badge-green">In Stock</span>
                      }
                    </td>
                    <td className="text-muted">{p.last_updated ? new Date(p.last_updated).toLocaleString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  );
}
