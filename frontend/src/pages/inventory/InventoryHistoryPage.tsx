import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  ArrowLeft,
  RefreshCw,
  Clock,
  User,
  ArrowDownRight,
  ArrowUpRight,
  Sliders,
  ArrowLeftRight,
  Tag,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  InventoryTransaction,
  InventoryTransactionType,
} from '../../types/inventory';
import { fetchInventoryHistory } from '../../api/inventory';
import { fetchWarehouses } from '../../api/warehouses';
import { Warehouse } from '../../types/warehouse';
import { fetchProducts } from '../../api/catalog';
import { Product } from '../../types/catalog';

interface InventoryHistoryPageProps {
  onBackToOverview: () => void;
}

export const InventoryHistoryPage: React.FC<InventoryHistoryPageProps> = ({
  onBackToOverview,
}) => {
  const [history, setHistory] = useState<InventoryTransaction[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([fetchWarehouses(), fetchProducts(0, 100)])
      .then(([whs, prods]) => {
        setWarehouses(whs);
        setProducts(prods.content);
      })
      .catch((err) => console.error('Failed to load filter metadata:', err));
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchInventoryHistory(
        page,
        15,
        selectedWarehouseId,
        selectedProductId,
        selectedType
      );
      setHistory(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error('Failed to load transaction history:', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedWarehouseId, selectedProductId, selectedType]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const typeConfig: Record<InventoryTransactionType, { label: string; icon: React.ElementType; color: string }> = {
    STOCK_IN: { label: 'STOCK IN', icon: ArrowDownRight, color: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
    STOCK_OUT: { label: 'STOCK OUT', icon: ArrowUpRight, color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    ADJUSTMENT: { label: 'ADJUSTMENT', icon: Sliders, color: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
    TRANSFER_IN: { label: 'TRANSFER IN', icon: ArrowLeftRight, color: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' },
    TRANSFER_OUT: { label: 'TRANSFER OUT', icon: ArrowLeftRight, color: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
    RESERVATION: { label: 'RESERVATION', icon: Tag, color: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
    FULFILLMENT: { label: 'FULFILLMENT', icon: Package, color: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToOverview}
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <History className="h-6 w-6 text-indigo-400" />
              <span>Immutable Inventory Audit Ledger</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Chronological ledger tracking every stock-in, dispatch, reconciliation, and inter-hub transfer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadHistory()}
            disabled={loading}
            title="Refresh"
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex flex-wrap items-center gap-3">
        {/* Warehouse Filter */}
        <div className="min-w-[180px] flex-1">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Warehouse
          </label>
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              setSelectedWarehouseId(e.target.value === '' ? '' : Number(e.target.value));
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.city})
              </option>
            ))}
          </select>
        </div>

        {/* Product Filter */}
        <div className="min-w-[180px] flex-1">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Product SKU
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(e.target.value === '' ? '' : Number(e.target.value));
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            <option value="">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Transaction Type Filter */}
        <div className="min-w-[150px]">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value);
              setPage(0);
            }}
            className="w-full px-3 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          >
            <option value="">All Types</option>
            <option value="STOCK_IN">STOCK IN</option>
            <option value="STOCK_OUT">STOCK OUT</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="TRANSFER_IN">TRANSFER IN</option>
            <option value="TRANSFER_OUT">TRANSFER OUT</option>
            <option value="RESERVATION">RESERVATION</option>
            <option value="FULFILLMENT">FULFILLMENT</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading ledger entries...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-200">No Transactions Found</h3>
            <p className="text-xs text-slate-400 mt-1">No recorded stock movements match the specified filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action Type</th>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-5 py-3">Warehouse Hub</th>
                  <th className="px-5 py-3 text-right">Qty Delta</th>
                  <th className="px-5 py-3">Reference / Reason</th>
                  <th className="px-5 py-3">Performed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {history.map((tx) => {
                  const conf = typeConfig[tx.transactionType] || {
                    label: tx.transactionType,
                    icon: Tag,
                    color: 'bg-slate-800 text-slate-300 border-slate-700',
                  };
                  const Icon = conf.icon;
                  const isPositive = tx.quantityDelta > 0;

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{new Date(tx.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${conf.color}`}>
                          <Icon className="h-3 w-3" />
                          <span>{conf.label}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-100">{tx.productName}</div>
                        <div className="text-[11px] font-mono text-indigo-400 font-medium">{tx.productSku}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{tx.warehouseName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${tx.quantityDelta}` : tx.quantityDelta}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs truncate">
                        <div className="text-slate-200 font-medium truncate">{tx.reason || 'N/A'}</div>
                        {tx.referenceId && (
                          <div className="text-[10px] font-mono text-slate-400">Ref: {tx.referenceId}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <User className="h-3.5 w-3.5 text-slate-500" />
                          <span>{tx.performedBy}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{history.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalElements}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-300">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
