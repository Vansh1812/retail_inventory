import React, { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  Minus,
  Sliders,
  ArrowLeftRight,
  Search,
  Building2,
  RefreshCw,
  AlertTriangle,
  History,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  stockIn,
  stockOut,
  adjustStock,
  transferStock,
  fetchInventoryOverview,
} from '../../api/inventory';
import { InventoryItem } from '../../types/inventory';
import { fetchWarehouses } from '../../api/warehouses';
import { Warehouse } from '../../types/warehouse';
import { fetchProducts } from '../../api/catalog';
import { Product } from '../../types/catalog';
import { StockOperationModal } from '../../components/inventory/StockOperationModal';
import { StockTransferModal } from '../../components/inventory/StockTransferModal';
import { useAuth } from '../../context/AuthContext';

interface InventoryOverviewPageProps {
  onNavigateToHistory: () => void;
}

export const InventoryOverviewPage: React.FC<InventoryOverviewPageProps> = ({
  onNavigateToHistory,
}) => {
  const { hasRole } = useAuth();
  const canManageInventory = hasRole('ADMIN') || hasRole('INVENTORY_MANAGER') || hasRole('WAREHOUSE_MANAGER');

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isOpModalOpen, setIsOpModalOpen] = useState(false);
  const [opType, setOpType] = useState<'IN' | 'OUT' | 'ADJUST'>('IN');
  const [selectedItemForOp, setSelectedItemForOp] = useState<InventoryItem | null>(null);

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, whData, prodRes] = await Promise.all([
        fetchInventoryOverview(
          selectedWarehouseId !== '' ? Number(selectedWarehouseId) : undefined,
          search || undefined,
          lowStockFilter || undefined
        ),
        fetchWarehouses('ACTIVE'),
        fetchProducts(0, 100, undefined, undefined, 'ACTIVE'),
      ]);
      setInventory(invData);
      setWarehouses(whData);
      setProducts(prodRes.content);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to load inventory data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(handler);
  }, [selectedWarehouseId, search, lowStockFilter]);

  // Derived Stats
  const stats = useMemo(() => {
    const totalItems = inventory.length;
    const totalUnits = inventory.reduce((acc, curr) => acc + curr.totalQuantity, 0);
    const reservedUnits = inventory.reduce((acc, curr) => acc + curr.reservedQuantity, 0);
    const availableUnits = inventory.reduce((acc, curr) => acc + curr.availableQuantity, 0);
    const lowStockCount = inventory.filter((i) => i.isLowStock).length;

    return { totalItems, totalUnits, reservedUnits, availableUnits, lowStockCount };
  }, [inventory]);

  const handleOpenOpModal = (type: 'IN' | 'OUT' | 'ADJUST', item?: InventoryItem) => {
    setOpType(type);
    setSelectedItemForOp(item || null);
    setIsOpModalOpen(true);
  };

  const handleStockOperationSubmit = async (params: {
    productId: number;
    warehouseId: number;
    quantity?: number;
    newTotalQuantity?: number;
    reason: string;
    referenceId?: string;
  }) => {
    if (opType === 'IN') {
      await stockIn({
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantity: params.quantity!,
        reason: params.reason,
        referenceId: params.referenceId,
      });
      setAlert({ type: 'success', message: `Stock-In of ${params.quantity} units completed!` });
    } else if (opType === 'OUT') {
      await stockOut({
        productId: params.productId,
        warehouseId: params.warehouseId,
        quantity: params.quantity!,
        reason: params.reason,
        referenceId: params.referenceId,
      });
      setAlert({ type: 'success', message: `Dispatched ${params.quantity} units successfully!` });
    } else if (opType === 'ADJUST') {
      await adjustStock({
        productId: params.productId,
        warehouseId: params.warehouseId,
        newTotalQuantity: params.newTotalQuantity!,
        reason: params.reason,
      });
      setAlert({ type: 'success', message: `Stock reconciled to ${params.newTotalQuantity} units!` });
    }
    loadData();
  };

  const handleTransferSubmit = async (params: {
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    productId: number;
    quantity: number;
    reason?: string;
  }) => {
    await transferStock({
      sourceWarehouseId: params.sourceWarehouseId,
      destinationWarehouseId: params.destinationWarehouseId,
      productId: params.productId,
      quantity: params.quantity,
      reason: params.reason || '',
    });
    setAlert({ type: 'success', message: `Inter-warehouse transfer of ${params.quantity} units completed!` });
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Buttons */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Boxes className="h-6 w-6 text-indigo-400" />
            <span>Inventory Engine &amp; Stock Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-location inventory with strict transactional consistency (Available = Total − Reserved).
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={onNavigateToHistory}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-700/80 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <History className="h-4 w-4 text-slate-400" />
            <span>Transaction Ledger</span>
          </button>

          {canManageInventory && (
            <>
              <button
                onClick={() => handleOpenOpModal('IN')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Stock In</span>
              </button>

              <button
                onClick={() => handleOpenOpModal('OUT')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Minus className="h-3.5 w-3.5" />
                <span>Stock Out</span>
              </button>

              <button
                onClick={() => handleOpenOpModal('ADJUST')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Adjust</span>
              </button>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span>Transfer</span>
              </button>
            </>
          )}

          <button
            onClick={() => loadData()}
            disabled={loading}
            title="Refresh"
            className="p-2 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total SKUs Stocked</div>
          <div className="mt-2 text-3xl font-bold text-white tracking-tight">{stats.totalItems}</div>
          <div className="mt-1 text-xs text-slate-400">Active catalog items in hub</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Physical Units</div>
          <div className="mt-2 text-3xl font-bold text-indigo-400 font-mono tracking-tight">{stats.totalUnits.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">Gross physical inventory</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Reserved for Orders</div>
          <div className="mt-2 text-3xl font-bold text-amber-400 font-mono tracking-tight">{stats.reservedUnits.toLocaleString()}</div>
          <div className="mt-1 text-xs text-slate-400">Allocated to pending orders</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Warnings</div>
          <div className="mt-2 text-3xl font-bold text-rose-400 flex items-center gap-2 tracking-tight">
            <span>{stats.lowStockCount}</span>
            {stats.lowStockCount > 0 && <AlertTriangle className="h-5 w-5 text-rose-500 animate-pulse" />}
          </div>
          <div className="mt-1 text-xs text-slate-400">Below reorder threshold</div>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs backdrop-blur-md animate-in fade-in duration-200 ${
          alert.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Warehouse Selector Tabs & Search Filter */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 space-y-3">
        {/* Warehouse Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedWarehouseId('')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedWarehouseId === ''
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>All Facilities</span>
          </button>

          {warehouses.map((wh) => (
            <button
              key={wh.id}
              onClick={() => setSelectedWarehouseId(wh.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedWarehouseId === wh.id
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>{wh.name}</span>
              <span className="text-[10px] text-slate-500">({wh.city})</span>
            </button>
          ))}
        </div>

        {/* Search & Low Stock Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <div className="relative w-full sm:w-80">
            <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU or product name..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-rose-500 focus:ring-rose-500/30 h-4 w-4"
            />
            <span className={lowStockFilter ? 'text-rose-400 font-bold' : ''}>
              Show Only Low Stock (Available &le; Reorder Level)
            </span>
          </label>
        </div>
      </div>

      {/* Inventory Data Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading inventory ledgers...</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="p-12 text-center">
            <Boxes className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-200">No Inventory Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || lowStockFilter
                ? 'No items match your active filters.'
                : 'No stock records currently exist for this location.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3">Product / SKU</th>
                  <th className="px-5 py-3">Warehouse Hub</th>
                  <th className="px-5 py-3 text-right">Total Qty</th>
                  <th className="px-5 py-3 text-right">Reserved</th>
                  <th className="px-5 py-3 text-right">Available Qty</th>
                  <th className="px-5 py-3 text-right">Reorder Level</th>
                  <th className="px-5 py-3 text-center">Stock Status</th>
                  {canManageInventory && <th className="px-5 py-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-100">{item.productName}</div>
                      <div className="text-[11px] font-mono text-indigo-400 font-medium">{item.productSku}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-slate-200">{item.warehouseName}</div>
                      <div className="text-[10px] text-slate-400">{item.warehouseCity}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white">
                      {item.totalQuantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-amber-400 font-semibold">
                      {item.reservedQuantity.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg ${
                          item.isLowStock
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-black animate-pulse'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.availableQuantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-400">
                      {item.reorderLevel.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                          <AlertTriangle className="h-3 w-3 text-rose-400" />
                          <span>LOW STOCK</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          <span>OPTIMAL</span>
                        </span>
                      )}
                    </td>
                    {canManageInventory && (
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenOpModal('IN', item)}
                            title="Quick Stock In"
                            className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenOpModal('OUT', item)}
                            title="Quick Stock Out"
                            className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenOpModal('ADJUST', item)}
                            title="Adjust Count"
                            className="p-1.5 text-slate-400 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          >
                            <Sliders className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock Operation Modal */}
      <StockOperationModal
        isOpen={isOpModalOpen}
        operationType={opType}
        onClose={() => setIsOpModalOpen(false)}
        onSubmit={handleStockOperationSubmit}
        warehouses={warehouses}
        products={products}
        selectedItem={selectedItemForOp}
        defaultWarehouseId={selectedWarehouseId !== '' ? Number(selectedWarehouseId) : undefined}
      />

      {/* Inter-Warehouse Transfer Modal */}
      <StockTransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        warehouses={warehouses}
        products={products}
        inventoryItems={inventory}
        defaultWarehouseId={selectedWarehouseId !== '' ? Number(selectedWarehouseId) : undefined}
      />
    </div>
  );
};
