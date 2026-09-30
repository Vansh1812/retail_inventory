import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  currentTab: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentTab }) => {
  const tabTitles: Record<string, string> = {
    dashboard: 'Enterprise Telemetry & Overview',
    inventory: 'Real-time Stock Ledgers & Adjustments',
    catalog: 'Product Catalog & Category SKUs',
    warehouses: 'Multi-Location Warehouses & Hubs',
    suppliers: 'Supplier Directory & Performance Ratings',
    procurement: 'Suppliers & Purchase Order Pipeline',
    orders: 'Customer Orders & Inventory Reservations',
    fulfillment: 'Fulfillment Queue & Shipping Dispatches',
    reports: 'Financial Valuation & Analytics Reports',
    'customer-orders': 'Customer Portal / My Orders & Live Tracking',
    'customer-profile': 'Customer Portal / Profile & Addresses',
    'supplier-pos': 'Vendor Portal / Assigned Purchase Orders',
    'supplier-profile': 'Vendor Portal / Company Profile',
    'admin-users': 'Administration / User Directory & Access Control',
    'admin-audit': 'Administration / Security Activity & Audit Logs',
  };

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 py-3 px-6 bg-slate-950/40 border-b border-slate-800/60 backdrop-blur-md">
      <div className="flex items-center gap-1.5 hover:text-slate-200 transition-colors cursor-pointer">
        <Home className="h-3.5 w-3.5 text-indigo-400" />
        <span className="font-medium text-slate-300">OmniStock</span>
      </div>
      <ChevronRight className="h-3 w-3 text-slate-400" />
      <span className="font-semibold text-slate-200 tracking-wide">
        {tabTitles[currentTab] || 'Workspace Module'}
      </span>
    </div>
  );
};
