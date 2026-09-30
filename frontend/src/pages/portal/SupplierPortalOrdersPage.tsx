import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Truck,
  RefreshCw,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getSupplierPurchaseOrders, acknowledgePurchaseOrder } from '../../api/portal';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types/procurement';
import { useAuth } from '../../context/AuthContext';

export const SupplierPortalOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ id: number; message: string; isError?: boolean } | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getSupplierPurchaseOrders();
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Failed to fetch supplier purchase orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAcknowledge = async (po: PurchaseOrder) => {
    setActionLoadingId(po.id);
    setActionFeedback(null);
    try {
      const updated = await acknowledgePurchaseOrder(po.id);
      setPurchaseOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      setActionFeedback({
        id: po.id,
        message: `PO ${po.poNumber} confirmed! Production & dispatch in progress.`,
      });
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setActionFeedback({
        id: po.id,
        message: errorMsg || 'Failed to acknowledge purchase order.',
        isError: true,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(search.toLowerCase()) ||
      po.warehouseName.toLowerCase().includes(search.toLowerCase()) ||
      po.items.some((i) =>
        i.productName.toLowerCase().includes(search.toLowerCase()) ||
        i.productSku.toLowerCase().includes(search.toLowerCase())
      );
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Draft
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Awaiting Vendor Acknowledgment
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed &amp; In Production
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Goods Inbounded at Hub
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const totalSpend = purchaseOrders
    .filter((po) => po.status !== 'CANCELLED')
    .reduce((sum, po) => sum + Number(po.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Vendor Portal &amp; Purchase Order Review</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Supplier Workspace for <span className="font-semibold text-slate-200">{user?.username}</span>. Review procurement purchase orders and acknowledge production dispatches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700/60 bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned POs</span>
          <div className="text-2xl font-bold text-white mt-1.5">{purchaseOrders.length}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Action Needed</span>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">
            {purchaseOrders.filter((po) => po.status === 'SUBMITTED').length}
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">In Production</span>
          <div className="text-2xl font-bold text-blue-400 mt-1.5">
            {purchaseOrders.filter((po) => po.status === 'CONFIRMED').length}
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Total Contract Value</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">
            ${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by PO number, item SKU, or warehouse hub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500 transition-all"
        >
          <option value="ALL" className="bg-slate-900 text-slate-200">All Statuses</option>
          <option value="SUBMITTED" className="bg-slate-900 text-slate-200">Pending Acknowledgment</option>
          <option value="CONFIRMED" className="bg-slate-900 text-slate-200">Confirmed / In Production</option>
          <option value="RECEIVED" className="bg-slate-900 text-slate-200">Goods Received</option>
          <option value="CANCELLED" className="bg-slate-900 text-slate-200">Cancelled</option>
        </select>
      </div>

      {/* Purchase Orders List */}
      {loading ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading vendor purchase orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No purchase orders found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search || statusFilter !== 'ALL'
              ? 'No purchase orders match your filter criteria.'
              : 'There are currently no purchase orders assigned to your supplier company.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((po) => (
            <div
              key={po.id}
              className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl hover:border-slate-700/80 transition-all overflow-hidden"
            >
              {/* PO Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-950/40 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    PO
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{po.poNumber}</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        Issued: {new Date(po.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        Target Hub: {po.warehouseName} ({po.warehouseCity})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="sm:border-l sm:border-slate-800/80 sm:pl-6">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</div>
                    <div className="text-lg font-black text-amber-400">
                      ${Number(po.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>

                  {po.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleAcknowledge(po)}
                      disabled={actionLoadingId === po.id}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      {actionLoadingId === po.id ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Acknowledging...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Acknowledge PO</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Action Feedback Banner */}
              {actionFeedback && actionFeedback.id === po.id && (
                <div
                  className={`mx-5 mt-3 p-3 rounded-xl border flex items-center gap-2 text-xs ${
                    actionFeedback.isError
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  }`}
                >
                  {actionFeedback.isError ? (
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              {/* Line Items */}
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Contract Batch Items ({po.items.length})
                </div>
                <div className="divide-y divide-slate-800/50">
                  {po.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{item.productName}</span>
                        <span className="ml-2 text-[10px] font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                          {item.productSku}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-slate-400">
                          {item.quantity} units &times; ${Number(item.unitCost).toFixed(2)}
                        </span>
                        <span className="font-bold text-slate-200 w-24 text-right">
                          ${Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {po.notes && (
                  <div className="mt-4 p-3 bg-slate-950/50 rounded-xl text-xs text-slate-300 border border-slate-800/80">
                    <span className="font-semibold text-amber-300">Replenishment Notes: </span>
                    {po.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
