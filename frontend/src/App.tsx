import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RoleRoute } from './components/RoleRoute';
import { LoginPage } from './pages/LoginPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsListPage } from './pages/catalog/ProductsListPage';
import { UsersManagementPage } from './pages/admin/UsersManagementPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { WarehousesListPage } from './pages/warehouse/WarehousesListPage';
import { InventoryOverviewPage } from './pages/inventory/InventoryOverviewPage';
import { InventoryHistoryPage } from './pages/inventory/InventoryHistoryPage';
import { SuppliersListPage } from './pages/procurement/SuppliersListPage';
import { PurchaseOrdersListPage } from './pages/procurement/PurchaseOrdersListPage';
import { OrdersListPage } from './pages/orders/OrdersListPage';
import { FulfillmentQueuePage } from './pages/fulfillment/FulfillmentQueuePage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { CustomerPortalOrdersPage } from './pages/portal/CustomerPortalOrdersPage';
import { SupplierPortalOrdersPage } from './pages/portal/SupplierPortalOrdersPage';
import { CustomerProfilePage } from './pages/portal/CustomerProfilePage';
import { SupplierProfilePage } from './pages/portal/SupplierProfilePage';
import { Construction } from 'lucide-react';

interface MainAppShellProps {
  initialTab?: string;
}

const MainAppShell: React.FC<MainAppShellProps> = ({ initialTab }) => {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isCustomer = hasRole('CUSTOMER') && !isAdmin;
  const isSupplier = hasRole('SUPPLIER') && !isAdmin;

  const getDefaultTab = () => {
    if (initialTab) return initialTab;
    if (isCustomer) return 'customer-orders';
    if (isSupplier) return 'supplier-pos';
    return 'dashboard';
  };

  const [currentTab, setCurrentTab] = useState<string>(getDefaultTab);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefreshHealth = () => {
    setIsRefreshing(true);
    setConnectionStatus('checking');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <AppLayout
      connectionStatus={connectionStatus}
      onRefreshHealth={handleRefreshHealth}
      isRefreshing={isRefreshing}
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
    >
      {/* 1. Analytics & Overview */}
      {currentTab === 'dashboard' && (
        <DashboardPage
          onNavigateToTab={setCurrentTab}
        />
      )}

      {/* 2. Inventory & Warehouses */}
      {currentTab === 'inventory' && (
        <InventoryOverviewPage onNavigateToHistory={() => setCurrentTab('inventory-history')} />
      )}

      {currentTab === 'inventory-history' && (
        <InventoryHistoryPage onBackToOverview={() => setCurrentTab('inventory')} />
      )}

      {currentTab === 'catalog' && (
        <ProductsListPage />
      )}

      {currentTab === 'warehouses' && (
        <WarehousesListPage />
      )}

      {/* 3. Procurement & Vendors */}
      {currentTab === 'suppliers' && (
        <SuppliersListPage />
      )}

      {currentTab === 'procurement' && (
        <PurchaseOrdersListPage />
      )}

      {/* 4. Internal Orders & Fulfillment */}
      {currentTab === 'orders' && (
        <OrdersListPage />
      )}

      {currentTab === 'fulfillment' && (
        <FulfillmentQueuePage />
      )}

      {/* 5. Reports & Intelligence */}
      {currentTab === 'reports' && (
        <ReportsPage />
      )}

      {/* 6. Customer Portal Personas */}
      {currentTab === 'customer-orders' && (
        <CustomerPortalOrdersPage />
      )}

      {currentTab === 'customer-profile' && (
        <CustomerProfilePage onNavigateToOrders={() => setCurrentTab('customer-orders')} />
      )}

      {/* 7. Supplier Portal Personas */}
      {currentTab === 'supplier-pos' && (
        <SupplierPortalOrdersPage />
      )}

      {currentTab === 'supplier-profile' && (
        <SupplierProfilePage onNavigateToPOs={() => setCurrentTab('supplier-pos')} />
      )}

      {/* 8. Administration (Role Protected) */}
      {currentTab === 'admin-users' && (
        <RoleRoute requiredRole="ADMIN">
          <UsersManagementPage />
        </RoleRoute>
      )}

      {currentTab === 'admin-audit' && (
        <RoleRoute requiredRole="ADMIN">
          <AuditLogsPage />
        </RoleRoute>
      )}

      {/* Fallback for unconfigured tabs */}
      {![
        'dashboard',
        'inventory',
        'inventory-history',
        'catalog',
        'warehouses',
        'suppliers',
        'procurement',
        'orders',
        'fulfillment',
        'reports',
        'customer-orders',
        'customer-profile',
        'supplier-pos',
        'supplier-profile',
        'admin-users',
        'admin-audit',
      ].includes(currentTab) && (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <div className="inline-flex p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Construction className="h-8 w-8 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-white capitalize">
            {currentTab} Management
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2">
            Configure and manage {currentTab} operations across your locations and fulfillment hubs.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              Go to Overview
            </button>
            <button
              onClick={() => setCurrentTab('catalog')}
              className="px-4 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
            >
              View Product Catalog
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register-customer" element={<CustomerRegisterPage />} />

          {/* Dedicated Customer Portal Route */}
          <Route
            path="/portal/customer/orders"
            element={
              <ProtectedRoute>
                <MainAppShell initialTab="customer-orders" />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Supplier Portal Route */}
          <Route
            path="/portal/supplier/purchase-orders"
            element={
              <ProtectedRoute>
                <MainAppShell initialTab="supplier-pos" />
              </ProtectedRoute>
            }
          />

          {/* Protected Enterprise Workspace */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <MainAppShell />
              </ProtectedRoute>
            }
          />

          {/* Root Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
