import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Plus,
  Search,
  RefreshCw,
  ShoppingBag,
  MapPin,
  Calendar,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getCustomerOrders, placeCustomerOrder } from '../../api/portal';
import { fetchProducts } from '../../api/catalog';
import { Order, OrderStatus } from '../../types/order';
import { Product } from '../../types/catalog';
import { useAuth } from '../../context/AuthContext';

export const CustomerPortalOrdersPage: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Place Order Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [submittingOrder, setSubmittingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getCustomerOrders();
      setOrders(data);
    } catch (err: unknown) {
      console.error('Failed to fetch customer orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openPlaceOrderModal = async () => {
    setIsModalOpen(true);
    setOrderError(null);
    setOrderSuccess(null);
    setSelectedProductId('');
    setOrderQuantity(1);
    setOrderNotes('');

    try {
      const prodRes = await fetchProducts(0, 50);
      setProducts(prodRes.content.filter((p: Product) => p.status === 'ACTIVE'));
      if (prodRes.content.length > 0) {
        setSelectedProductId(prodRes.content[0].id);
      }
    } catch (err) {
      console.error('Failed to load products for customer order modal:', err);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || orderQuantity < 1) {
      setOrderError('Please select a product and enter a valid quantity.');
      return;
    }

    setSubmittingOrder(true);
    setOrderError(null);

    try {
      await placeCustomerOrder({
        notes: orderNotes.trim() || undefined,
        items: [
          {
            productId: Number(selectedProductId),
            quantity: Number(orderQuantity),
          },
        ],
      });
      setOrderSuccess('Order successfully placed! You can track its fulfillment status below.');
      setTimeout(() => {
        setIsModalOpen(false);
        fetchOrders();
      }, 1200);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setOrderError(errorMsg || 'Failed to place order. Please try again.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some(
        (i) =>
          i.productName.toLowerCase().includes(search.toLowerCase()) ||
          i.productSku.toLowerCase().includes(search.toLowerCase())
      );
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending Confirmation
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Stock Reserved
          </span>
        );
      case 'PROCESSING':
      case 'PACKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Package className="w-3.5 h-3.5" />
            Packaging in Hub
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Truck className="w-3.5 h-3.5 animate-bounce" />
            In Transit (Shipped)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <X className="w-3.5 h-3.5" />
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

  const selectedProduct = products.find((p) => p.id === Number(selectedProductId));
  const estimatedSubtotal = selectedProduct ? selectedProduct.sellingPrice * orderQuantity : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Customer Orders &amp; Shipment Tracking</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Welcome, <span className="font-semibold text-slate-200">{user?.username}</span>. View your order history, delivery dispatches, and place self-service orders.
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
          <button
            onClick={openPlaceOrderModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Place New Order</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
          <div className="text-2xl font-bold text-white mt-1.5">{orders.length}</div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">In Progress</span>
          <div className="text-2xl font-bold text-amber-400 mt-1.5">
            {orders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING', 'PACKED'].includes(o.status)).length}
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">In Transit</span>
          <div className="text-2xl font-bold text-purple-400 mt-1.5">
            {orders.filter((o) => o.status === 'SHIPPED').length}
          </div>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Delivered</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1.5">
            {orders.filter((o) => o.status === 'DELIVERED').length}
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by order number, SKU, or product..."
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
          <option value="PENDING" className="bg-slate-900 text-slate-200">Pending</option>
          <option value="CONFIRMED" className="bg-slate-900 text-slate-200">Confirmed</option>
          <option value="PACKED" className="bg-slate-900 text-slate-200">Packed</option>
          <option value="SHIPPED" className="bg-slate-900 text-slate-200">Shipped (In Transit)</option>
          <option value="DELIVERED" className="bg-slate-900 text-slate-200">Delivered</option>
          <option value="CANCELLED" className="bg-slate-900 text-slate-200">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <div className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No orders found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {search || statusFilter !== 'ALL'
              ? 'No orders matched your search filters.'
              : 'You have not placed any orders yet. Click "Place New Order" to start shopping.'}
          </p>
          {!search && statusFilter === 'ALL' && (
            <button
              onClick={openPlaceOrderModal}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              Place Your First Order
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl hover:border-slate-700/80 transition-all overflow-hidden"
            >
              {/* Order Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-950/40 border-b border-slate-800/80 gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    #
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{order.orderNumber}</span>
                      {getStatusBadge(order.status)}
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        Origin: {order.warehouseName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-800/80 sm:pl-6">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Amount</div>
                  <div className="text-lg font-black text-emerald-400">
                    ${Number(order.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Order Line Items */}
              <div className="p-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Items Ordered ({order.items.length})
                </div>
                <div className="divide-y divide-slate-800/50">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-white">{item.productName}</span>
                        <span className="ml-2 text-[10px] font-mono bg-slate-800 text-indigo-300 px-1.5 py-0.5 rounded border border-slate-700/60">
                          {item.productSku}
                        </span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-slate-400">
                          {item.quantity} &times; ${Number(item.unitPrice).toFixed(2)}
                        </span>
                        <span className="font-bold text-slate-200 w-20 text-right">
                          ${Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipment & Live Tracking Information */}
                {order.shipment ? (
                  <div className="mt-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-300">Live Delivery Dispatch Information</span>
                      </div>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {order.shipment.carrier}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-medium">Tracking Number</span>
                        <p className="font-mono font-bold text-white mt-0.5">{order.shipment.trackingNumber}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-medium">Dispatched At</span>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {order.shipment.shippedAt ? new Date(order.shipment.shippedAt).toLocaleString() : 'Processing'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-medium">Delivered Status</span>
                        <p className="font-semibold text-slate-200 mt-0.5">
                          {order.shipment.deliveredAt
                            ? `Delivered on ${new Date(order.shipment.deliveredAt).toLocaleDateString()}`
                            : 'In Transit'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400 italic">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Fulfillment in queue at hub. Tracking number will appear once carrier dispatch occurs.</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Place Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900/95 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-800/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <h3 className="font-bold text-white text-sm">Place Customer Order</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-6 space-y-4">
              {orderError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{orderError}</span>
                </div>
              )}

              {orderSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{orderSuccess}</span>
                </div>
              )}

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Select Product *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(Number(e.target.value))}
                  required
                  disabled={submittingOrder}
                  className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-xs"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-400">-- Select a Catalog Item --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                      {p.name} ({p.sku}) &mdash; ${p.sellingPrice.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  required
                  disabled={submittingOrder}
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-xs"
                />
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Delivery Notes / Instructions
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Leave package at front door, express handling requested"
                  disabled={submittingOrder}
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all shadow-xs"
                />
              </div>

              {/* Estimated Total */}
              {selectedProduct && (
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Estimated Order Subtotal:</span>
                  <span className="font-extrabold text-emerald-400 text-sm">
                    ${estimatedSubtotal.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submittingOrder}
                  className="px-4 py-2 border border-slate-700/80 bg-slate-800/50 text-slate-300 rounded-xl text-xs font-medium hover:bg-slate-800 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOrder}
                  className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {submittingOrder ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting Order...</span>
                    </>
                  ) : (
                    <span>Confirm Order Placement</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
