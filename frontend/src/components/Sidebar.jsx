import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, Tag, Package, ShoppingCart,
  ClipboardList, Truck, RotateCcw, DollarSign, Star, BarChart3
} from 'lucide-react';

const navItems = [
  { section: 'Overview', links: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  ]},
  { section: 'Catalogue', links: [
    { to: '/products', label: 'Products', icon: Package },
    { to: '/categories', label: 'Categories', icon: Tag },
    { to: '/inventory', label: 'Inventory / Stock', icon: Store },
  ]},
  { section: 'Users', links: [
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/sellers', label: 'Sellers', icon: Store },
  ]},
  { section: 'Sales', links: [
    { to: '/cart', label: 'Cart & Checkout', icon: ShoppingCart },
    { to: '/orders', label: 'Orders', icon: ClipboardList },
    { to: '/shipments', label: 'Shipments', icon: Truck },
  ]},
  { section: 'After-Sales', links: [
    { to: '/returns', label: 'Returns', icon: RotateCcw },
    { to: '/refunds', label: 'Refunds', icon: DollarSign },
    { to: '/reviews', label: 'Reviews', icon: Star },
  ]},
  { section: 'Analytics', links: [
    { to: '/reports', label: 'Reports', icon: BarChart3 },
  ]},
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">E</div>
        <span>EcommerceDB</span>
      </div>
      <nav>
        {navItems.map(section => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
