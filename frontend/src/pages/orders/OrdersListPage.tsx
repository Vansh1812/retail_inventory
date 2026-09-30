import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Package,
  AlertCircle,
  Loader2,
  Building,
} from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';
import { Warehouse } from '../../types/warehouse';
import { fetchOrders, confirmOrder, cancelOrder } from '../../api/orders';
import { fetchWarehouses } from '../../api/warehouses';
import { useAuth } from '../../context/AuthContext';
import { CreateOrderModal } from '../../components/orders/CreateOrderModal';
import { OrderDetailsModal } from '../../components/orders/OrderDetailsModal';

export const OrdersListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrOrderManager = user?.roles.some(r => ['ROLE_ADMIN', 'ROLE_ORDER_MANAGER'].includes(r));

  const [orders, setOrders] = useState<Order[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [warehouseFilter, setWarehouseFilter] = useState<number | ''>('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, warehouseFilter]);

  const loadWarehouses = async () => {
    try {
      const whList = await fetchWarehouses();
      setWarehouses(whList);
    } catch (err) {
      console.error('Failed to load warehouses', err);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchOrders(
        page,
        pageSize,
        statusFilter,
        warehouseFilter,
        undefined,
        search
      );
      setOrders(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadOrders();
  };

  const handleConfirmOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to confirm this order? This will atomically reserve warehouse stock for all items.')) {
      return;
    }
    try {
      setError(null);
      await confirmOrder(orderId);
      setActionSuccess('Order confirmed and stock successfully reserved!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to confirm order');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!window.confirm('Are you sure you want to cancel this order? Any reserved inventory will be released back to the warehouse.')) {
      return;
    }
    try {
      setError(null);
      await cancelOrder(orderId);
      setActionSuccess('Order cancelled and reserved stock released!');
      setTimeout(() => setActionSuccess(null), 4000);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to cancel order');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="h-3 w-3 mr-1" />
            PENDING
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            CONFIRMED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Package className="h-3 w-3 mr-1" />
            PROCESSING
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Package className="h-3 w-3 mr-1" />
            PACKED
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Truck className="h-3 w-3 mr-1" />
            SHIPPED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            CANCELLED
          </span>
        );
      default:
        return <span className="text-xs text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ShoppingCart className="h-6 w-6 text-indigo-400" />
            <span>Customer Sales Orders</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage client orders, review live inventory allocations, and orchestrate stock reservations.
          </p>
        </div>

        {isAdminOrOrderManager && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Sales Order</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-300 flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-center gap-2 backdrop-blur-md animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="Search by Order # or Customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/70 pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition-all"
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        </form>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as OrderStatus | '');
              setPage(0);
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="PENDING" className="bg-slate-900 text-slate-200">PENDING</option>
            <option value="CONFIRMED" className="bg-slate-900 text-slate-200">CONFIRMED</option>
            <option value="PROCESSING" className="bg-slate-900 text-slate-200">PROCESSING</option>
            <option value="PACKED" className="bg-slate-900 text-slate-200">PACKED</option>
            <option value="SHIPPED" className="bg-slate-900 text-slate-200">SHIPPED</option>
            <option value="DELIVERED" className="bg-slate-900 text-slate-200">DELIVERED</option>
            <option value="CANCELLED" className="bg-slate-900 text-slate-200">CANCELLED</option>
          </select>
        </div>

        {/* Warehouse Filter */}
        <div>
          <select
            value={warehouseFilter}
            onChange={(e) => {
              setWarehouseFilter(e.target.value ? Number(e.target.value) : '');
              setPage(0);
            }}
            className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 focus:outline-hidden transition-all"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Fulfillment Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id} className="bg-slate-900 text-slate-200">
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="px-6 py-3.5">
                  Order #
                </th>
                <th className="px-6 py-3.5">
                  Customer
                </th>
                <th className="px-6 py-3.5">
                  Warehouse
                </th>
                <th className="px-6 py-3.5 text-center">
                  Items
                </th>
                <th className="px-6 py-3.5 text-right">
                  Total Amount
                </th>
                <th className="px-6 py-3.5 text-center">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-400" />
                    <span className="mt-2 block text-xs">Loading orders...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <ShoppingCart className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                    <p className="text-sm font-bold text-white">No sales orders found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try adjusting your search criteria or create a new order.
                    </p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        {order.orderNumber}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-bold text-white">
                        {order.customerName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {order.customerEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-300">
                        <Building className="h-3.5 w-3.5 text-slate-500" />
                        <span>{order.warehouseName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-xs font-medium text-white">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} units
                      <span className="block text-[11px] text-slate-500 font-normal">
                        ({order.items.length} line items)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-mono font-bold text-white">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details */}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Quick Confirm */}
                        {isAdminOrOrderManager && order.status === 'PENDING' && (
                          <button
                            onClick={() => handleConfirmOrder(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/20 px-2.5 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors cursor-pointer"
                            title="Confirm & Reserve Stock"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Confirm</span>
                          </button>
                        )}

                        {/* Quick Cancel */}
                        {isAdminOrOrderManager && ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 transition-colors cursor-pointer"
                            title="Cancel Order & Release Reservation"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800/60 bg-slate-950/40 px-6 py-3 text-xs text-slate-400">
            <span>
              Showing page <span className="font-semibold text-slate-200">{page + 1}</span> of <span className="font-semibold text-slate-200">{totalPages}</span> ({totalElements} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setActionSuccess('Order created successfully in PENDING status!');
          setTimeout(() => setActionSuccess(null), 4000);
          loadOrders();
        }}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelOrder}
      />
    </div>
  );
};
