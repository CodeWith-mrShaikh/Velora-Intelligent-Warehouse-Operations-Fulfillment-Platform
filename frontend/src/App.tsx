import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthLayout from './layouts/AuthLayout';
import DashboardLayout from './layouts/DashboardLayout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import InventoryPage from './pages/InventoryPage';
import InventorySearchPage from './pages/InventorySearchPage';
import WarehousesPage from './pages/WarehousesPage';
import WarehouseDetailPage from './pages/WarehouseDetailPage';
import RowDetailPage from './pages/RowDetailPage';
import BinDetailPage from './pages/BinDetailPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PickingPage from './pages/PickingPage';
import StockMovementsPage from './pages/StockMovementsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      
      <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/inventory/search" element={<InventorySearchPage />} />
        
        <Route path="/warehouses" element={<WarehousesPage />} />
        <Route path="/warehouses/:id" element={<WarehouseDetailPage />} />
        <Route path="/rows/:id" element={<RowDetailPage />} />
        <Route path="/bins/:id" element={<BinDetailPage />} />
        
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        
        <Route path="/picking" element={<PickingPage />} />
        
        <Route path="/stock-movements" element={<StockMovementsPage />} />
        
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        
        <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>} />
        
        <Route path="*" element={<div className="p-8 text-center text-xl font-bold text-slate-500">404 - Page Not Found</div>} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
