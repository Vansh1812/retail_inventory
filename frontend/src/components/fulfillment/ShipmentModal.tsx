import React, { useState } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';
import { Order, DispatchOrderFormData } from '../../types/order';

interface ShipmentModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
  onSubmit: (orderId: number, data: DispatchOrderFormData) => Promise<void>;
}

const CARRIER_OPTIONS = [
  'FedEx Express',
  'DHL Express',
  'UPS Standard',
  'BlueDart Express',
  'USPS Priority Mail',
  'OnTrac Logistics',
];

export const ShipmentModal: React.FC<ShipmentModalProps> = ({
  isOpen,
  order,
  onClose,
  onSubmit,
}) => {
  const [carrier, setCarrier] = useState('FedEx Express');
  const [customCarrier, setCustomCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCarrier = carrier === 'Other' ? customCarrier.trim() : carrier;
    if (!finalCarrier) {
      setError('Please select or specify a shipping carrier');
      return;
    }
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmit(order.id, {
        carrier: finalCarrier,
        trackingNumber: trackingNumber.trim(),
      });
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to dispatch order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
              <Truck className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Dispatch & Ship Order
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {order.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="rounded-xl bg-slate-950/50 border border-slate-800/80 p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Customer</span>
              <span className="font-medium text-slate-200">{order.customerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Warehouse Origin</span>
              <span className="font-medium text-slate-200">{order.warehouseName}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-800/50">
              <span className="text-slate-400">Total Items</span>
              <span className="font-semibold text-indigo-300">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} units ({order.items.length} line items)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Shipping Carrier <span className="text-indigo-400">*</span>
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            >
              {CARRIER_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-slate-200">
                  {c}
                </option>
              ))}
              <option value="Other" className="bg-slate-900 text-slate-200">Other (Custom Carrier)</option>
            </select>
          </div>

          {carrier === 'Other' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Carrier Name <span className="text-indigo-400">*</span>
              </label>
              <input
                type="text"
                value={customCarrier}
                onChange={(e) => setCustomCarrier(e.target.value)}
                placeholder="Enter carrier name"
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Tracking Number <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. TRK-987654321"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              required
            />
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-300 leading-relaxed">
            Dispatching this order will permanently deduct the reserved inventory from the warehouse and post a <span className="font-semibold text-amber-200">FULFILLMENT</span> ledger transaction.
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700/80 bg-slate-800/50 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-semibold px-4 py-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Confirm & Dispatch</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
