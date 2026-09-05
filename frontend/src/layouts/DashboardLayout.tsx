import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Warehouse, Building2, ShoppingCart, 
  ClipboardCheck, ArrowLeftRight, FileText, Users, LogOut, Menu, X 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/inventory', icon: Warehouse, label: 'Inventory' },
    { to: '/warehouses', icon: Building2, label: 'Warehouses' },
    { to: '/orders', icon: ShoppingCart, label: 'Orders' },
    { to: '/picking', icon: ClipboardCheck, label: 'Picking' },
    { to: '/stock-movements', icon: ArrowLeftRight, label: 'Stock Movements' },
    ...(user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER' ? [{ to: '/audit-logs', icon: FileText, label: 'Audit Logs' }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/users', icon: Users, label: 'Users' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-700">
          <span className="text-xl font-bold text-blue-400">Velora</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-4rem)]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center px-4 py-3 rounded-lg transition-colors
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} className="mr-3" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-500 hover:text-slate-700 mr-4">
              <Menu size={24} />
            </button>
            <div className="hidden sm:block text-slate-500 font-medium text-sm">
              Velora — Intelligent Warehouse Operations &amp; Fulfillment Platform
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-right hidden sm:block">
              <div className="font-semibold text-slate-800">{user?.name}</div>
              <div className="text-slate-500 text-xs">{user?.role}</div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-full hover:bg-slate-100" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default DashboardLayout;
