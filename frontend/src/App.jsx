import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Sellers from './pages/Sellers';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Shipments from './pages/Shipments';
import Returns from './pages/Returns';
import Refunds from './pages/Refunds';
import Reviews from './pages/Reviews';
import Reports from './pages/Reports';
import './index.css';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/customers': 'Customers',
  '/sellers': 'Sellers',
  '/categories': 'Categories',
  '/products': 'Products',
  '/inventory': 'Inventory & Stock',
  '/cart': 'Cart & Checkout',
  '/orders': 'Orders',
  '/shipments': 'Shipments',
  '/returns': 'Returns',
  '/refunds': 'Refunds',
  '/reviews': 'Reviews',
  '/reports': 'Reports',
};

function Layout() {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'EcommerceDB';

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h1>{title}</h1>
          <span className="badge badge-green">PostgreSQL Connected</span>
        </div>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/sellers" element={<Sellers />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/shipments" element={<Shipments />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/refunds" element={<Refunds />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: 13.5 } }} />
      <Layout />
    </BrowserRouter>
  );
}
