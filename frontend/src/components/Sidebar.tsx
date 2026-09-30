import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  Package,
  Warehouse,
  ShoppingCart,
  Truck,
  BarChart3,
  Users,
  FileText,
  LogOut,
  Shield,
  ShoppingBag,
  Building2,
  User as UserIcon,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, hasRole, logout } = useAuth();
  const isAdmin = hasRole('ADMIN');
  const isCustomer = hasRole('CUSTOMER') && !isAdmin;
  const isSupplier = hasRole('SUPPLIER') && !isAdmin;

  const userInitials = (user?.username || 'U')
    .slice(0, 2)
    .toUpperCase();

  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'USER';

  // 1. Customer Navigation Items
  const customerNavItems = [
    { id: 'catalog', label: 'Browse Catalog', icon: Package },
    { id: 'customer-orders', label: 'My Orders & Tracking', icon: ShoppingBag },
    { id: 'customer-profile', label: 'Profile & Addresses', icon: UserIcon },
  ];

  // 2. Supplier Navigation Items
  const supplierNavItems = [
    { id: 'supplier-pos', label: 'Assigned Purchase Orders', icon: FileText },
    { id: 'supplier-profile', label: 'Company Profile', icon: Building2 },
  ];

  // 3. Workspace (Standard)
  const workspaceItems = [
    { id: 'dashboard', label: 'Overview & Telemetry', icon: LayoutDashboard },
  ];

  // 4. Supply Chain Items
  const supplyChainItems = [
    { id: 'inventory', label: 'Inventory Engine', icon: Boxes },
    { id: 'catalog', label: 'Product Catalog', icon: Package },
    { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'procurement', label: 'Procurement & PO', icon: ShoppingCart },
    { id: 'orders', label: 'Customer Orders', icon: FileText, roles: ['ADMIN', 'ORDER_MANAGER'] },
    { id: 'fulfillment', label: 'Fulfillment Queue', icon: Truck, roles: ['ADMIN', 'ORDER_MANAGER', 'WAREHOUSE_MANAGER'] },
    { id: 'reports', label: 'Reports & Valuation', icon: BarChart3 },
  ];

  // 5. Admin External Portals
  const adminPortalItems = [
    { id: 'customer-orders', label: 'Customer Portal View', icon: ShoppingBag },
    { id: 'supplier-pos', label: 'Vendor Portal View', icon: Building2 },
  ];

  // 6. Admin Governance
  const adminNavItems = [
    { id: 'admin-users', label: 'Users & Permissions', icon: Users },
    { id: 'admin-audit', label: 'Audit Activity Logs', icon: FileText },
  ];

  const renderNavButton = (item: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }) => {
    const Icon = item.icon;
    const isActive = currentTab === item.id;
    return (
      <button
        key={item.id}
        onClick={() => onSelectTab(item.id)}
        className={`w-full group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
          isActive
            ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/25 shadow-sm shadow-indigo-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
        }`}
      >
        {/* Glowing left accent pill indicator */}
        {isActive && (
          <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-indigo-500 shadow-sm shadow-indigo-500" />
        )}
        <div className="flex items-center gap-3">
          <Icon
            className={`h-4 w-4 transition-colors ${
              isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
            }`}
          />
          <span className="tracking-wide">{item.label}</span>
        </div>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-slate-950/90 backdrop-blur-md text-slate-300 flex flex-col shrink-0 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800/80 bg-slate-950/40">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20 border border-indigo-400/20">
          <span className="text-base font-black tracking-tight leading-none text-white">O</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>OmniStock</span>
            <span className="px-1.5 py-0.2 text-[9px] font-semibold bg-indigo-500/20 text-indigo-400 rounded-md border border-indigo-500/30">
              SaaS
            </span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium">
            {isCustomer && 'Customer Self-Service'}
            {isSupplier && 'Vendor Dispatch Portal'}
            {!isCustomer && !isSupplier && 'Enterprise Management'}
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {/* CUSTOMER PORTAL NAVIGATION */}
        {isCustomer && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              CUSTOMER SELF-SERVICE
            </div>
            {customerNavItems.map(renderNavButton)}
          </div>
        )}

        {/* SUPPLIER PORTAL NAVIGATION */}
        {isSupplier && (
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              VENDOR OPERATIONS
            </div>
            {supplierNavItems.map(renderNavButton)}
          </div>
        )}

        {/* INTERNAL / ADMIN ENTERPRISE NAVIGATION */}
        {!isCustomer && !isSupplier && (
          <>
            {/* WORKSPACE GROUP */}
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                WORKSPACE
              </div>
              {workspaceItems.map(renderNavButton)}
            </div>

            {/* SUPPLY CHAIN GROUP */}
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                SUPPLY CHAIN
              </div>
              {supplyChainItems.map((item) => {
                if (item.roles && !item.roles.some((r) => hasRole(r))) {
                  return null;
                }
                return renderNavButton(item);
              })}
            </div>

            {/* EXTERNAL PORTALS PREVIEW (ADMIN) */}
            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  <span>PORTAL SANDBOX</span>
                </div>
                {adminPortalItems.map(renderNavButton)}
              </div>
            )}

            {/* ADMINISTRATION GOVERNANCE (ADMIN) */}
            {isAdmin && (
              <div className="space-y-1 pt-2 border-t border-slate-800/60">
                <div className="px-3 pb-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="h-3 w-3" />
                  <span>ADMINISTRATION</span>
                </div>
                {adminNavItems.map(renderNavButton)}
              </div>
            )}
          </>
        )}
      </nav>

      {/* User Profile Chip at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Avatar Initials with online indicator */}
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                {userInitials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            <div className="truncate text-left">
              <div className="font-semibold text-xs text-slate-200 truncate">
                {user?.username || 'Operator'}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 truncate">
                  {primaryRole}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
