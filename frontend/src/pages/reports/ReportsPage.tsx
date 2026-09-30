import React, { useState, useEffect } from 'react';
import {
  Download,
  Filter,
  RefreshCw,
  Boxes,
  TrendingUp,
  Truck,
  Warehouse,
  Calendar,
} from 'lucide-react';
import {
  InventoryReportRow,
  SalesReport,
  ProcurementReport,
  WarehouseUtilization,
  fetchInventoryReport,
  fetchSalesReport,
  fetchProcurementReport,
  fetchWarehouseUtilizationReport,
} from '../../api/reports';
import { fetchWarehouses } from '../../api/warehouses';
import { fetchCategories } from '../../api/catalog';
import { fetchSuppliers } from '../../api/procurement';
import { Warehouse as WarehouseType } from '../../types/warehouse';
import { Category } from '../../types/catalog';
import { Supplier } from '../../types/procurement';

type ReportTab = 'inventory' | 'sales' | 'procurement' | 'warehouse';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('inventory');

  // Common filter data
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Inventory Report state
  const [invWarehouseId, setInvWarehouseId] = useState<number | undefined>();
  const [invCategoryId, setInvCategoryId] = useState<number | undefined>();
  const [inventoryData, setInventoryData] = useState<InventoryReportRow[]>([]);
  const [invLoading, setInvLoading] = useState(false);

  // Sales Report state
  const [salesStart, setSalesStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [salesEnd, setSalesEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [salesWarehouseId, setSalesWarehouseId] = useState<number | undefined>();
  const [salesData, setSalesData] = useState<SalesReport | null>(null);
  const [salesLoading, setSalesLoading] = useState(false);

  // Procurement Report state
  const [procStart, setProcStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [procEnd, setProcEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [procSupplierId, setProcSupplierId] = useState<number | undefined>();
  const [procData, setProcData] = useState<ProcurementReport | null>(null);
  const [procLoading, setProcLoading] = useState(false);

  // Warehouse Utilization state
  const [warehouseData, setWarehouseData] = useState<WarehouseUtilization[]>([]);
  const [whLoading, setWhLoading] = useState(false);

  // Load filter dropdown options
  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [whList, catList, supList] = await Promise.all([
          fetchWarehouses(),
          fetchCategories(),
          fetchSuppliers(),
        ]);
        setWarehouses(whList);
        setCategories(catList);
        setSuppliers(supList);
      } catch (err) {
        console.error('Failed to load filter lookups', err);
      }
    };
    loadLookups();
  }, []);

  // Fetch functions
  const loadInventoryReport = async () => {
    setInvLoading(true);
    try {
      const data = await fetchInventoryReport(invWarehouseId, invCategoryId);
      setInventoryData(data);
    } catch (err) {
      console.error('Failed to load inventory report', err);
    } finally {
      setInvLoading(false);
    }
  };

  const loadSalesReport = async () => {
    setSalesLoading(true);
    try {
      const data = await fetchSalesReport(salesStart, salesEnd, salesWarehouseId);
      setSalesData(data);
    } catch (err) {
      console.error('Failed to load sales report', err);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadProcurementReport = async () => {
    setProcLoading(true);
    try {
      const data = await fetchProcurementReport(procStart, procEnd, procSupplierId);
      setProcData(data);
    } catch (err) {
      console.error('Failed to load procurement report', err);
    } finally {
      setProcLoading(false);
    }
  };

  const loadWarehouseReport = async () => {
    setWhLoading(true);
    try {
      const data = await fetchWarehouseUtilizationReport();
      setWarehouseData(data);
    } catch (err) {
      console.error('Failed to load warehouse utilization', err);
    } finally {
      setWhLoading(false);
    }
  };

  // Trigger loads on tab change
  useEffect(() => {
    if (activeTab === 'inventory') loadInventoryReport();
    if (activeTab === 'sales') loadSalesReport();
    if (activeTab === 'procurement') loadProcurementReport();
    if (activeTab === 'warehouse') loadWarehouseReport();
  }, [activeTab]);

  // Format currency
  const formatCurrency = (val: number | undefined | null) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(num);
  };

  // CSV Export utility
  const exportToCsv = (filename: string, rows: any[], headers: { label: string; key: string }[]) => {
    if (!rows || !rows.length) return;

    const csvContent = [
      headers.map((h) => `"${h.label}"`).join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h.key];
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : `"${val ?? ''}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export handlers
  const handleExportInventory = () => {
    const headers = [
      { label: 'SKU', key: 'sku' },
      { label: 'Product Name', key: 'productName' },
      { label: 'Category', key: 'categoryName' },
      { label: 'Warehouse', key: 'warehouseName' },
      { label: 'On Hand', key: 'totalQuantity' },
      { label: 'Reserved', key: 'reservedQuantity' },
      { label: 'Available', key: 'availableQuantity' },
      { label: 'Reorder Level', key: 'reorderLevel' },
      { label: 'Cost Price', key: 'costPrice' },
      { label: 'Selling Price', key: 'sellingPrice' },
      { label: 'Asset Value', key: 'assetValue' },
      { label: 'Status', key: 'reorderStatus' },
    ];
    exportToCsv('inventory-valuation-report', inventoryData, headers);
  };

  const handleExportSales = () => {
    if (!salesData?.orders) return;
    const headers = [
      { label: 'Order #', key: 'orderNumber' },
      { label: 'Customer', key: 'customerName' },
      { label: 'Warehouse', key: 'warehouseName' },
      { label: 'Status', key: 'status' },
      { label: 'Total Amount', key: 'totalAmount' },
      { label: 'Created At', key: 'createdAt' },
    ];
    exportToCsv('sales-orders-report', salesData.orders, headers);
  };

  const handleExportProcurement = () => {
    if (!procData?.purchaseOrders) return;
    const headers = [
      { label: 'PO #', key: 'poNumber' },
      { label: 'Supplier', key: 'supplierName' },
      { label: 'Warehouse', key: 'warehouseName' },
      { label: 'Status', key: 'status' },
      { label: 'Total Amount', key: 'totalAmount' },
      { label: 'Created At', key: 'createdAt' },
    ];
    exportToCsv('procurement-orders-report', procData.purchaseOrders, headers);
  };

  const handleExportWarehouse = () => {
    const headers = [
      { label: 'Warehouse', key: 'warehouseName' },
      { label: 'City', key: 'city' },
      { label: 'Status', key: 'status' },
      { label: 'Capacity', key: 'capacity' },
      { label: 'Total Units', key: 'totalUnits' },
      { label: 'Utilization %', key: 'utilizationPercentage' },
      { label: 'Asset Value', key: 'totalAssetValue' },
      { label: 'Low Stock SKUs', key: 'lowStockSkuCount' },
    ];
    exportToCsv('warehouse-utilization-report', warehouseData, headers);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Analytics & Management Reporting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Financial valuations, sales metrics, procurement spend, and warehouse utilization.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800/90 overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Inventory Valuation</span>
          </button>
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Sales Performance</span>
          </button>
          <button
            onClick={() => setActiveTab('procurement')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'procurement'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Procurement & Spend</span>
          </button>
          <button
            onClick={() => setActiveTab('warehouse')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'warehouse'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Warehouse className="h-3.5 w-3.5" />
            <span>Warehouse Utilization</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INVENTORY ASSET VALUATION */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Filter By:</span>
              </div>

              {/* Warehouse selector */}
              <select
                value={invWarehouseId || ''}
                onChange={(e) => setInvWarehouseId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id} className="bg-slate-900 text-slate-200">
                    {wh.name} ({wh.city})
                  </option>
                ))}
              </select>

              {/* Category selector */}
              <select
                value={invCategoryId || ''}
                onChange={(e) => setInvCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadInventoryReport}
                className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${invLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Apply</span>
              </button>
            </div>

            <button
              onClick={handleExportInventory}
              disabled={inventoryData.length === 0}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Metrics summary banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Products
              </span>
              <div className="text-2xl font-bold text-white mt-1.5">{inventoryData.length} SKUs</div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Units On Hand
              </span>
              <div className="text-2xl font-bold text-white mt-1.5">
                {inventoryData.reduce((acc, row) => acc + (row.totalQuantity || 0), 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Asset Valuation
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1.5">
                {formatCurrency(
                  inventoryData.reduce((acc, row) => acc + (Number(row.assetValue) || 0), 0)
                )}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Reorder Warnings
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1.5">
                {
                  inventoryData.filter(
                    (row) => row.reorderStatus === 'CRITICAL_LOW' || row.reorderStatus === 'OUT_OF_STOCK'
                  ).length
                }{' '}
                Items
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800/80">
                  <tr>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4 text-center">On Hand</th>
                    <th className="py-3 px-4 text-center">Reserved</th>
                    <th className="py-3 px-4 text-center">Available</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-right">Selling</th>
                    <th className="py-3 px-4 text-right">Asset Value</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {invLoading ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-400" />
                        Generating valuation report...
                      </td>
                    </tr>
                  ) : inventoryData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        No inventory matches the selected criteria.
                      </td>
                    </tr>
                  ) : (
                    inventoryData.map((row, idx) => (
                      <tr key={`${row.productId}-${row.warehouseId}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-indigo-300">{row.sku}</td>
                        <td className="py-3 px-4 font-semibold text-white">{row.productName}</td>
                        <td className="py-3 px-4 text-slate-400">{row.categoryName}</td>
                        <td className="py-3 px-4 text-slate-300">{row.warehouseName}</td>
                        <td className="py-3 px-4 text-center font-bold text-white">{row.totalQuantity}</td>
                        <td className="py-3 px-4 text-center text-slate-400">{row.reservedQuantity}</td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold ${
                              row.availableQuantity <= row.reorderLevel ? 'text-rose-400' : 'text-emerald-400'
                            }`}
                          >
                            {row.availableQuantity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-400">{formatCurrency(row.costPrice)}</td>
                        <td className="py-3 px-4 text-right text-slate-400">{formatCurrency(row.sellingPrice)}</td>
                        <td className="py-3 px-4 text-right font-bold text-emerald-400">
                          {formatCurrency(row.assetValue)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                              row.reorderStatus === 'OPTIMAL'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : row.reorderStatus === 'LOW'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : row.reorderStatus === 'CRITICAL_LOW'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {row.reorderStatus.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SALES PERFORMANCE */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>From:</span>
                <input
                  type="date"
                  value={salesStart}
                  onChange={(e) => setSalesStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>To:</span>
                <input
                  type="date"
                  value={salesEnd}
                  onChange={(e) => setSalesEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <select
                value={salesWarehouseId || ''}
                onChange={(e) => setSalesWarehouseId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Warehouses</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id} className="bg-slate-900 text-slate-200">
                    {wh.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadSalesReport}
                className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${salesLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Run</span>
              </button>
            </div>

            <button
              onClick={handleExportSales}
              disabled={!salesData?.orders || salesData.orders.length === 0}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Sales KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="text-2xl font-bold text-indigo-400 mt-1.5">
                {formatCurrency(salesData?.totalRevenue)}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Orders Placed
              </span>
              <div className="text-2xl font-bold text-white mt-1.5">
                {(salesData?.totalOrders ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Units Sold
              </span>
              <div className="text-2xl font-bold text-white mt-1.5">
                {(salesData?.totalUnitsSold ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Average Order Value
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1.5">
                {formatCurrency(salesData?.averageOrderValue)}
              </div>
            </div>
          </div>

          {/* Top Selling Products Table */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Top Selling Products</h3>
              <span className="text-xs text-slate-400">Ranked by revenue contribution</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800/80">
                  <tr>
                    <th className="py-2.5 px-4">Rank</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-4">Product Name</th>
                    <th className="py-2.5 px-4 text-center">Units Sold</th>
                    <th className="py-2.5 px-4 text-right">Total Revenue ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(!salesData?.topProducts || salesData.topProducts.length === 0) ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No product sales recorded in selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    salesData.topProducts.map((p, idx) => (
                      <tr key={p.productId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-slate-500">#{idx + 1}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-indigo-300">{p.sku}</td>
                        <td className="py-2.5 px-4 font-semibold text-white">{p.productName}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-indigo-400">{p.unitsSold}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                          {formatCurrency(p.totalSales)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROCUREMENT & SPEND */}
      {activeTab === 'procurement' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>From:</span>
                <input
                  type="date"
                  value={procStart}
                  onChange={(e) => setProcStart(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <span>To:</span>
                <input
                  type="date"
                  value={procEnd}
                  onChange={(e) => setProcEnd(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <select
                value={procSupplierId || ''}
                onChange={(e) => setProcSupplierId(e.target.value ? Number(e.target.value) : undefined)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-800 bg-slate-950/70 text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="" className="bg-slate-900 text-slate-200">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={loadProcurementReport}
                className="px-3.5 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700/60 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${procLoading ? 'animate-spin text-indigo-400' : ''}`} />
                <span>Run</span>
              </button>
            </div>

            <button
              onClick={handleExportProcurement}
              disabled={!procData?.purchaseOrders || procData.purchaseOrders.length === 0}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          {/* Procurement KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Spend ($)
              </span>
              <div className="text-2xl font-bold text-amber-400 mt-1.5">
                {formatCurrency(procData?.totalSpend)}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Purchase Orders
              </span>
              <div className="text-2xl font-bold text-white mt-1.5">
                {(procData?.totalPurchaseOrders ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Received & Replenished
              </span>
              <div className="text-2xl font-bold text-emerald-400 mt-1.5">
                {(procData?.receivedOrdersCount ?? 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                In-Flight / Pending
              </span>
              <div className="text-2xl font-bold text-indigo-400 mt-1.5">
                {(procData?.pendingOrdersCount ?? 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Vendor Spend Breakdown Table */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Supplier Spend Allocation</h3>
              <span className="text-xs text-slate-400">Procurement volume per vendor</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800/80">
                  <tr>
                    <th className="py-2.5 px-4">Supplier Name</th>
                    <th className="py-2.5 px-4 text-center">PO Count</th>
                    <th className="py-2.5 px-4 text-right">Total Inbound Spend ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {(!procData?.supplierBreakdown || procData.supplierBreakdown.length === 0) ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        No supplier spend recorded in selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    procData.supplierBreakdown.map((s) => (
                      <tr key={s.supplierId} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-semibold text-white">{s.supplierName}</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-300">{s.poCount}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-amber-400">
                          {formatCurrency(s.totalSpend)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WAREHOUSE UTILIZATION */}
      {activeTab === 'warehouse' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Regional Distribution Hubs</h3>
              <p className="text-xs text-slate-400">Capacity utilization, stock levels, and safety buffer monitoring</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadWarehouseReport}
                className="p-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 rounded-xl transition-colors shadow-xs"
              >
                <RefreshCw className={`h-4 w-4 ${whLoading ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
              <button
                onClick={handleExportWarehouse}
                disabled={warehouseData.length === 0}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {warehouseData.map((wh) => (
              <div key={wh.warehouseId} className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{wh.warehouseName}</h4>
                      <p className="text-xs text-slate-400">{wh.city}</p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${
                        wh.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {wh.status}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-400">Capacity Usage</span>
                      <span className="font-bold text-white">{wh.utilizationPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          wh.utilizationPercentage >= 90
                            ? 'bg-rose-500'
                            : wh.utilizationPercentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, wh.utilizationPercentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800/60 text-xs">
                    <div>
                      <span className="text-slate-400">Total Units</span>
                      <div className="font-bold text-slate-200 mt-0.5">{wh.totalUnits.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Max Capacity</span>
                      <div className="font-bold text-slate-200 mt-0.5">{wh.capacity.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Asset Value</span>
                      <div className="font-bold text-emerald-400 mt-0.5">{formatCurrency(wh.totalAssetValue)}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Depleted SKUs</span>
                      <div className={`font-bold mt-0.5 ${wh.lowStockSkuCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {wh.lowStockSkuCount}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
