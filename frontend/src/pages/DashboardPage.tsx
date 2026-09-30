import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Warehouse,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  DashboardSummary,
  fetchDashboardSummary,
} from '../api/dashboard';

interface DashboardPageProps {
  onNavigateToTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToTab,
}) => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'STAFF';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardSummary();
      setSummary(data);
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setError(errorObj?.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'SHIPPED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'PACKED':
      case 'PROCESSING':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'CONFIRMED':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CANCELLED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="relative">
          <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin" />
          <div className="absolute inset-0 blur-md bg-indigo-500/30 rounded-full" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Synchronizing Telemetry &amp; Ledgers...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Controls */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Active
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-mono text-slate-400">99.98% Service SLA</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Enterprise Operations Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated as <span className="font-semibold text-slate-200">{user?.username}</span> ({primaryRole}) &bull; Real-time visibility across inventory ledgers, hubs, and customer reservations.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh Data"
            className="p-2.5 border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={() => onNavigateToTab('reports')}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-700/80 bg-slate-900/80 hover:bg-indigo-600/20 hover:border-indigo-500/50 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer group"
          >
            <span>Valuation Reports</span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-medium backdrop-blur-md">
          {error}
        </div>
      )}

      {/* 4 Hero KPI Cards with Glassmorphism & Gradient Glow Accents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Products */}
        <div
          onClick={() => onNavigateToTab('products')}
          className="relative bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden"
        >
          {/* Subtle Corner Glow Accent */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Active Catalog
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform shadow-inner">
              <Package className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {summary?.totalProducts ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+12.4%</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-xs text-slate-400">Active product SKUs</span>
              {summary && summary.lowStockCount > 0 && (
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  {summary.lowStockCount} alerts
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Total Inventory Valuation */}
        <div
          onClick={() => onNavigateToTab('inventory')}
          className="relative bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 hover:border-emerald-500/50 shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Inventory Valuation
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform shadow-inner">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {formatCurrency(summary?.totalValuation)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span>+8.2%</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {(summary?.totalInventoryUnits ?? 0).toLocaleString()}
              </span>
              <span>total units on hand</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Orders */}
        <div
          onClick={() => onNavigateToTab('orders')}
          className="relative bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 hover:border-violet-500/50 shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/10 rounded-full blur-xl group-hover:bg-violet-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Orders
            </span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-105 transition-transform shadow-inner">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {summary?.pendingOrdersCount ?? 0}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
                Pipeline
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-indigo-400 font-medium">
              <Activity className="h-3.5 w-3.5" />
              <span>Awaiting reservation & fulfillment</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Warehouses */}
        <div
          onClick={() => onNavigateToTab('warehouses')}
          className="relative bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 hover:border-cyan-500/50 shadow-xl transition-all duration-200 cursor-pointer group overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl group-hover:bg-cyan-500/20 transition-colors" />

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fulfillment Hubs
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-105 transition-transform shadow-inner">
              <Warehouse className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {summary?.activeWarehousesCount ?? 0} Hubs
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>100% Up</span>
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
              <span>Synchronized across regions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Stock Alert Banner */}
      {summary && summary.lowStockCount > 0 && (
        <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                Action Required: {summary.lowStockCount} SKU(s) reached or fell below safety reorder threshold
              </h3>
              <p className="text-xs text-amber-400/80 mt-0.5">
                Warehouse stock buffers require replenishment. Review depleted inventory ledgers below to issue vendor purchase orders.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('procurement')}
            className="shrink-0 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Create Purchase Order</span>
          </button>
        </div>
      )}

      {/* Visualizations Section: 2 Charts with Dark Theme Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: 7-Day Revenue vs Procurement Spend */}
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                7-Day Revenue vs Procurement Spend
              </h3>
              <p className="text-xs text-slate-400">
                Customer sales revenue contrasted with inbound inventory procurement
              </p>
            </div>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              Daily Trend
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={summary?.dailySalesVsSpend || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#334155"
                />
                <YAxis
                  tickFormatter={(val) => `$${val}`}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#334155"
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  labelFormatter={(lbl) => `Date: ${formatShortDate(String(lbl))}`}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                <Area
                  type="monotone"
                  dataKey="salesRevenue"
                  name="Sales Revenue ($)"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#salesGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="procurementSpend"
                  name="Procurement Spend ($)"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#spendGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Warehouse Stock & Capacity Utilization */}
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Warehouse Stock Distribution &amp; Capacity
              </h3>
              <p className="text-xs text-slate-400">
                Current stock units on hand relative to designed maximum capacity
              </p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
              Fulfillment Hubs
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={summary?.stockPerWarehouse || []}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="warehouseName"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#334155"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  stroke="#334155"
                />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    Number(val).toLocaleString(),
                    name === 'totalUnits' ? 'Current Units' : 'Max Capacity',
                  ]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    borderRadius: '12px',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    fontSize: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
                <Bar
                  dataKey="totalUnits"
                  name="Stock On Hand (Units)"
                  fill="#06b6d4"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="capacity"
                  name="Max Capacity (Units)"
                  fill="#475569"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two Actionable Split Tables with Dark SaaS Minimalist Headers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Customer Orders */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div>
              <h3 className="text-sm font-bold text-white">Recent Customer Orders</h3>
              <p className="text-xs text-slate-400">Latest sales orders processed across warehouses</p>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Origin Hub</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(!summary?.recentOrders || summary.recentOrders.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-mono text-xs">
                      No customer orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  summary.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-indigo-300">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        {order.customerName}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {order.warehouseName}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-100 font-mono">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${getOrderStatusBadge(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Critical Low Stock Items */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Critical Depleted Inventory</span>
                {summary && summary.criticalLowStockItems.length > 0 && (
                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    Depleted
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">SKUs below minimum safety reorder buffers</p>
            </div>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ledger</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU &amp; Item</th>
                  <th className="py-3 px-4">Warehouse</th>
                  <th className="py-3 px-4 text-center">Avail / Safety</th>
                  <th className="py-3 px-4 text-center">Deficit</th>
                  <th className="py-3 px-4 text-center">Quick PO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(!summary?.criticalLowStockItems || summary.criticalLowStockItems.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-emerald-400/80 font-mono text-xs">
                      All inventory stock levels are currently healthy!
                    </td>
                  </tr>
                ) : (
                  summary.criticalLowStockItems.map((item, idx) => (
                    <tr
                      key={`${item.productId}-${item.warehouseId}-${idx}`}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 line-clamp-1">
                          {item.productName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{item.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {item.warehouseName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="font-bold text-rose-400">{item.availableQuantity}</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-slate-400">{item.reorderLevel}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-bold border border-rose-500/30 text-[10px] font-mono">
                          -{item.deficit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onNavigateToTab('procurement')}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg font-semibold text-[10px] border border-indigo-500/30 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <PlusCircle className="h-3 w-3" />
                          <span>Order</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
