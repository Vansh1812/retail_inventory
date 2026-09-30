import React, { useState, useEffect } from 'react';
import {
  Truck,
  Clock,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Building,
  User,
  AlertCircle,
  Loader2,
  Check,
} from 'lucide-react';
import { Order, OrderStatus, DispatchOrderFormData } from '../../types/order';
import { Warehouse } from '../../types/warehouse';
import { fetchFulfillmentQueue, updateFulfillmentStatus, dispatchOrder } from '../../api/fulfillment';
import { fetchWarehouses } from '../../api/warehouses';
import { ShipmentModal } from '../../components/fulfillment/ShipmentModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';

export const FulfillmentQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadQueue();
  }, [warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const whList = await fetchWarehouses();
      setWarehouses(whList);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadQueue = async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await fetchFulfillmentQueue(warehouseFilter);
      setQueue(orders);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load fulfillment queue');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (orderId: number, nextStatus: OrderStatus) => {
    try {
      setActionLoadingId(orderId);
      setError(null);
      await updateFulfillmentStatus(orderId, nextStatus);
      setSuccessMessage(`Order updated to ${nextStatus}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      loadQueue();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to transition order status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDispatchOrder = async (orderId: number, data: DispatchOrderFormData) => {
    await dispatchOrder(orderId, data);
    setSuccessMessage(`Order dispatched successfully via ${data.carrier}! Physical stock deducted.`);
    setTimeout(() => setSuccessMessage(null), 4000);
    loadQueue();
  };

  const confirmedOrders = queue.filter(o => o.status === 'CONFIRMED');
  const processingOrders = queue.filter(o => o.status === 'PROCESSING');
  const packedOrders = queue.filter(o => o.status === 'PACKED');

  const renderOrderCard = (order: Order, currentColumn: 'CONFIRMED' | 'PROCESSING' | 'PACKED') => {
    const isActionLoading = actionLoadingId === order.id;

    return (
      <div
        key={order.id}
        className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 shadow-md hover:border-slate-700/80 transition-all space-y-3"
      >
        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-400">
                {order.orderNumber}
              </span>
              <button
                onClick={() => setViewingOrder(order)}
                className="text-xs text-slate-400 hover:text-indigo-400 underline cursor-pointer"
              >
                details
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 mt-1">
              <User className="h-3.5 w-3.5 text-slate-500" />
              <span>{order.customerName}</span>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center">
            <Clock className="h-3 w-3 mr-1 text-slate-500" />
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Warehouse Indicator */}
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <Building className="h-3.5 w-3.5 text-emerald-400" />
          <span className="font-medium text-slate-300">{order.warehouseName}</span>
        </div>

        {/* Items Picking Checklist */}
        <div className="rounded-xl bg-slate-900/70 p-2.5 border border-slate-800 space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Items to Pack ({order.items.reduce((s, i) => s + i.quantity, 0)} units):
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-xs">
                <span className="text-slate-200 truncate pr-2">
                  {item.productName}
                </span>
                <span className="font-mono font-semibold bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] text-indigo-300">
                  x{item.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
            <span className="font-semibold">Note:</span> {order.notes}
          </div>
        )}

        {/* Card Pipeline Action Buttons */}
        <div className="pt-2 border-t border-slate-800">
          {currentColumn === 'CONFIRMED' && (
            <button
              onClick={() => handleStatusTransition(order.id, 'PROCESSING')}
              disabled={isActionLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 py-2 px-3 text-xs font-semibold text-white disabled:opacity-50 transition shadow-lg shadow-purple-600/25 cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <span>Start Picking</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}

          {currentColumn === 'PROCESSING' && (
            <button
              onClick={() => handleStatusTransition(order.id, 'PACKED')}
              disabled={isActionLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2 px-3 text-xs font-semibold text-white disabled:opacity-50 transition shadow-lg shadow-indigo-600/25 cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Mark as Packed</span>
                </>
              )}
            </button>
          )}

          {currentColumn === 'PACKED' && (
            <button
              onClick={() => setShippingOrder(order)}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2 px-3 text-xs font-semibold text-white transition shadow-lg shadow-emerald-600/25 cursor-pointer"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Ship Order</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-indigo-400" />
            <span>Order Fulfillment Pipeline</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Real-time warehouse pick, pack, and carrier dispatch workflow with automated inventory ledger sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value ? Number(e.target.value) : '')}
            className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                {w.name}
              </option>
            ))}
          </select>

          <button
            onClick={loadQueue}
            disabled={loading}
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Queue"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: To Pick (CONFIRMED) */}
        <div className="rounded-2xl border border-blue-500/20 bg-slate-900/60 backdrop-blur-md p-4 space-y-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/20">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-400"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                1. To Pick (Confirmed)
              </h2>
            </div>
            <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-300">
              {confirmedOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {confirmedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No orders waiting to be picked
              </div>
            ) : (
              confirmedOrders.map(order => renderOrderCard(order, 'CONFIRMED'))
            )}
          </div>
        </div>

        {/* Column 2: In Progress / Packing (PROCESSING) */}
        <div className="rounded-2xl border border-purple-500/20 bg-slate-900/60 backdrop-blur-md p-4 space-y-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between pb-2.5 border-b border-purple-500/20">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                2. Packing In Progress
              </h2>
            </div>
            <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-300">
              {processingOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {processingOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No orders currently being packed
              </div>
            ) : (
              processingOrders.map(order => renderOrderCard(order, 'PROCESSING'))
            )}
          </div>
        </div>

        {/* Column 3: Ready for Dispatch (PACKED) */}
        <div className="rounded-2xl border border-emerald-500/20 bg-slate-900/60 backdrop-blur-md p-4 space-y-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                3. Ready for Dispatch (Packed)
              </h2>
            </div>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
              {packedOrders.length}
            </span>
          </div>

          <div className="space-y-3">
            {packedOrders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No orders ready for shipment
              </div>
            ) : (
              packedOrders.map(order => renderOrderCard(order, 'PACKED'))
            )}
          </div>
        </div>
      </div>

      {/* Shipment Modal */}
      <ShipmentModal
        isOpen={!!shippingOrder}
        order={shippingOrder}
        onClose={() => setShippingOrder(null)}
        onSubmit={handleDispatchOrder}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!viewingOrder}
        order={viewingOrder}
        onClose={() => setViewingOrder(null)}
      />
    </div>
  );
};
