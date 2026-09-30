import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchPurchaseOrders,
  createPurchaseOrder,
  submitPurchaseOrder,
  receiveGoods,
  cancelPurchaseOrder,
  fetchSuppliers,
} from '../../api/procurement';
import { fetchWarehouses } from '../../api/warehouses';
import { fetchProducts } from '../../api/catalog';
import { PurchaseOrder, PurchaseOrderFormData, PurchaseOrderStatus, Supplier } from '../../types/procurement';
import { Warehouse } from '../../types/warehouse';
import { Product } from '../../types/catalog';
import { CreatePurchaseOrderModal } from '../../components/procurement/CreatePurchaseOrderModal';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Plus,
  Search,
  RefreshCw,
  PackageCheck,
  Send,
  XCircle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const PurchaseOrdersListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageProcurement = hasRole('ADMIN') || hasRole('PROCUREMENT_MANAGER');

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [selectedStatus, setSelectedStatus] = useState<PurchaseOrderStatus | ''>('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | ''>('');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    Promise.all([fetchSuppliers(), fetchWarehouses(), fetchProducts(0, 100)])
      .then(([sups, whs, prods]) => {
        setSuppliers(sups);
        setWarehouses(whs);
        setProducts(prods.content);
      })
      .catch((err) => console.error('Failed to load PO metadata:', err));
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPurchaseOrders(page, 10, selectedStatus, selectedWarehouseId, '', search);
      setOrders(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to load purchase orders.' });
    } finally {
      setLoading(false);
    }
  }, [page, selectedStatus, selectedWarehouseId, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCreateSubmit = async (formData: PurchaseOrderFormData) => {
    await createPurchaseOrder(formData);
    setAlert({ type: 'success', message: 'New Purchase Order created in DRAFT status!' });
    loadOrders();
  };

  const handleSubmitPO = async (id: number) => {
    setActionLoadingId(id);
    try {
      await submitPurchaseOrder(id);
      setAlert({ type: 'success', message: 'Purchase Order submitted to supplier!' });
      loadOrders();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to submit PO' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReceiveGoods = async (id: number) => {
    setActionLoadingId(id);
    try {
      await receiveGoods(id);
      setAlert({ type: 'success', message: 'Goods received successfully! Target warehouse inventory replenished.' });
      loadOrders();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to process goods receipt' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelPO = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this purchase order?')) return;
    setActionLoadingId(id);
    try {
      await cancelPurchaseOrder(id, 'Cancelled from management dashboard');
      setAlert({ type: 'success', message: 'Purchase Order cancelled.' });
      loadOrders();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to cancel PO' });
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusBadge = (status: PurchaseOrderStatus) => {
    const config: Record<PurchaseOrderStatus, string> = {
      DRAFT: 'bg-slate-800 text-slate-400 border-slate-700',
      SUBMITTED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CONFIRMED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      RECEIVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      CANCELLED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${config[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-indigo-400" />
            <span>Procurement &amp; Purchase Orders (PO)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supplier procurement lifecycle, goods receipt verification, and automated inventory replenishment.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadOrders()}
            disabled={loading}
            title="Refresh"
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {canManageProcurement && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {alert && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs backdrop-blur-md animate-in fade-in duration-200 ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
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

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by PO Number or vendor..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedWarehouseId}
            onChange={(e) => {
              setSelectedWarehouseId(e.target.value === '' ? '' : Number(e.target.value));
              setPage(0);
            }}
            className="px-3 py-1.5 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                {w.name} ({w.city})
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value as PurchaseOrderStatus | '');
              setPage(0);
            }}
            className="px-3 py-1.5 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="DRAFT" className="bg-slate-900 text-slate-200">DRAFT</option>
            <option value="SUBMITTED" className="bg-slate-900 text-slate-200">SUBMITTED</option>
            <option value="RECEIVED" className="bg-slate-900 text-slate-200">RECEIVED</option>
            <option value="CANCELLED" className="bg-slate-900 text-slate-200">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading purchase orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Purchase Orders Found</h3>
            <p className="text-xs text-slate-400 mt-1">Create a purchase order to initiate vendor procurement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">PO Number</th>
                  <th className="px-5 py-3.5">Supplier</th>
                  <th className="px-5 py-3.5">Destination Warehouse</th>
                  <th className="px-5 py-3.5 text-right">Items / Total</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5">Created</th>
                  {canManageProcurement && <th className="px-5 py-3.5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orders.map((po) => {
                  const isProcessing = actionLoadingId === po.id;

                  return (
                    <tr key={po.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono font-bold text-indigo-400">{po.poNumber}</div>
                        {po.notes && <div className="text-[10px] text-slate-400 line-clamp-1">{po.notes}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-white">{po.supplierName}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-slate-200">{po.warehouseName}</div>
                        <div className="text-[10px] text-slate-400">{po.warehouseCity}</div>
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono">
                        <div className="font-bold text-white">
                          ${po.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400">{po.items?.length || 0} line items</div>
                      </td>
                      <td className="px-5 py-3.5 text-center">{statusBadge(po.status)}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                        {new Date(po.createdAt).toLocaleDateString()}
                      </td>
                      {canManageProcurement && (
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Submit PO (if DRAFT) */}
                            {po.status === 'DRAFT' && (
                              <button
                                onClick={() => handleSubmitPO(po.id)}
                                disabled={isProcessing}
                                title="Submit to Vendor"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                <span>Submit</span>
                              </button>
                            )}

                            {/* Receive Goods (if SUBMITTED) */}
                            {po.status === 'SUBMITTED' && (
                              <button
                                onClick={() => handleReceiveGoods(po.id)}
                                disabled={isProcessing}
                                title="Receive Goods & Stock In"
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-colors disabled:opacity-50 cursor-pointer"
                              >
                                {isProcessing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <PackageCheck className="h-3.5 w-3.5" />}
                                <span>Receive Goods</span>
                              </button>
                            )}

                            {/* Cancel PO (if DRAFT or SUBMITTED) */}
                            {(po.status === 'DRAFT' || po.status === 'SUBMITTED') && (
                              <button
                                onClick={() => handleCancelPO(po.id)}
                                disabled={isProcessing}
                                title="Cancel Order"
                                className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{orders.length}</span> of{' '}
              <span className="font-semibold text-slate-200">{totalElements}</span> orders
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-200">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreatePurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        suppliers={suppliers}
        warehouses={warehouses}
        products={products}
      />
    </div>
  );
};
