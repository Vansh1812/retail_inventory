import React from 'react';
import { X, Package, User, Warehouse as WarehouseIcon, Truck, CheckCircle2, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Order, OrderStatus } from '../../types/order';

interface OrderDetailsModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onConfirm?: (orderId: number) => void;
  onCancel?: (orderId: number) => void;
}

const statusConfig: Record<OrderStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  PENDING: {
    label: 'Pending Confirmation',
    bg: 'bg-amber-500/10 border border-amber-500/20',
    text: 'text-amber-400',
    icon: <Clock className="h-3.5 w-3.5 mr-1 text-amber-400" />,
  },
  CONFIRMED: {
    label: 'Confirmed & Stock Reserved',
    bg: 'bg-blue-500/10 border border-blue-500/20',
    text: 'text-blue-400',
    icon: <ShieldCheck className="h-3.5 w-3.5 mr-1 text-blue-400" />,
  },
  PROCESSING: {
    label: 'Processing / Picking',
    bg: 'bg-purple-500/10 border border-purple-500/20',
    text: 'text-purple-400',
    icon: <Package className="h-3.5 w-3.5 mr-1 text-purple-400" />,
  },
  PACKED: {
    label: 'Packed & Ready',
    bg: 'bg-indigo-500/10 border border-indigo-500/20',
    text: 'text-indigo-400',
    icon: <Package className="h-3.5 w-3.5 mr-1 text-indigo-400" />,
  },
  SHIPPED: {
    label: 'Shipped / Dispatched',
    bg: 'bg-cyan-500/10 border border-cyan-500/20',
    text: 'text-cyan-400',
    icon: <Truck className="h-3.5 w-3.5 mr-1 text-cyan-400" />,
  },
  DELIVERED: {
    label: 'Delivered',
    bg: 'bg-emerald-500/10 border border-emerald-500/20',
    text: 'text-emerald-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />,
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10 border border-rose-500/20',
    text: 'text-rose-400',
    icon: <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-400" />,
  },
};

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  order,
  onClose,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !order) return null;

  const currentStatusInfo = statusConfig[order.status] || {
    label: order.status,
    bg: 'bg-slate-800 border border-slate-700',
    text: 'text-slate-400',
    icon: null,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-3xl rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  {order.orderNumber}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${currentStatusInfo.bg} ${currentStatusInfo.text}`}>
                  {currentStatusInfo.icon}
                  {currentStatusInfo.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Created on {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Metadata Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Box */}
            <div className="rounded-xl border border-slate-800 p-4 bg-slate-950/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <User className="h-4 w-4 text-indigo-400" />
                <span>Customer Information</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <p className="font-bold text-white text-sm">{order.customerName}</p>
                <p className="text-slate-400">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-slate-400">{order.customerPhone}</p>}
                {order.customerAddress && <p className="text-[11px] text-slate-500">{order.customerAddress}</p>}
              </div>
            </div>

            {/* Warehouse Box */}
            <div className="rounded-xl border border-slate-800 p-4 bg-slate-950/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                <WarehouseIcon className="h-4 w-4 text-emerald-400" />
                <span>Fulfillment Warehouse</span>
              </div>
              <div className="text-xs space-y-1 text-slate-300">
                <p className="font-bold text-white text-sm">{order.warehouseName}</p>
                <p className="text-[11px] text-slate-500">Warehouse Facility ID: #{order.warehouseId}</p>
                {order.notes && (
                  <div className="mt-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-2 text-xs text-indigo-300">
                    <span className="font-semibold">Note:</span> {order.notes}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Shipment Card if present */}
          {order.shipment && (
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
                <Truck className="h-4 w-4 text-cyan-400" />
                <span>Dispatch & Carrier Tracking</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Carrier:</span>
                  <span className="font-semibold text-white">{order.shipment.carrier}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Tracking #:</span>
                  <span className="font-mono font-semibold text-cyan-300">
                    {order.shipment.trackingNumber}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Dispatched:</span>
                  <span className="text-white">
                    {order.shipment.shippedAt ? new Date(order.shipment.shippedAt).toLocaleString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Delivered:</span>
                  <span className="text-white">
                    {order.shipment.deliveredAt ? new Date(order.shipment.deliveredAt).toLocaleString() : 'In Transit'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Order Line Items ({order.items.length})
            </h3>
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Unit Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-white">
                        {item.productName}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-indigo-400">
                        {item.productSku}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-medium">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        ${item.unitPrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        ${item.subtotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-950/80 border-t border-slate-800">
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-right font-semibold text-slate-400">
                      Total Order Amount:
                    </td>
                    <td className="px-4 py-3 text-right text-base font-black font-mono text-indigo-400">
                      ${order.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Quick Action Buttons inside modal */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800/80">
            <div className="flex items-center gap-2">
              {order.status === 'PENDING' && onConfirm && (
                <button
                  type="button"
                  onClick={() => onConfirm(order.id)}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 px-4 py-2 text-xs font-semibold text-white hover:from-indigo-600 hover:to-violet-700 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  Confirm &amp; Reserve Stock
                </button>
              )}
              {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && onCancel && (
                <button
                  type="button"
                  onClick={() => onCancel(order.id)}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
                >
                  Cancel Order
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
