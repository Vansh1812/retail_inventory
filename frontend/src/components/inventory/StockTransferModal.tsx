import React, { useState, useEffect } from 'react';
import { Warehouse } from '../../types/warehouse';
import { Product } from '../../types/catalog';
import { InventoryItem } from '../../types/inventory';
import { X, ArrowLeftRight, RefreshCw, AlertCircle, Info } from 'lucide-react';

interface StockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: {
    sourceWarehouseId: number;
    destinationWarehouseId: number;
    productId: number;
    quantity: number;
    reason?: string;
  }) => Promise<void>;
  warehouses: Warehouse[];
  products: Product[];
  inventoryItems: InventoryItem[];
  defaultWarehouseId?: number;
}

export const StockTransferModal: React.FC<StockTransferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
  products,
  inventoryItems,
  defaultWarehouseId,
}) => {
  const [sourceWarehouseId, setSourceWarehouseId] = useState<number | ''>('');
  const [destinationWarehouseId, setDestinationWarehouseId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defaultWarehouseId) {
      setSourceWarehouseId(defaultWarehouseId);
    } else if (warehouses.length > 0) {
      setSourceWarehouseId(warehouses[0].id);
    }

    if (warehouses.length > 1) {
      const other = warehouses.find((w) => w.id !== defaultWarehouseId);
      if (other) setDestinationWarehouseId(other.id);
    }

    if (products.length > 0) {
      setProductId(products[0].id);
    }

    setQuantity('');
    setReason('');
    setError(null);
  }, [warehouses, products, defaultWarehouseId, isOpen]);

  if (!isOpen) return null;

  // Live Available Stock Calculator for Selected Source & Product
  const matchingInventory = inventoryItems.find(
    (inv) => inv.warehouseId === Number(sourceWarehouseId) && inv.productId === Number(productId)
  );

  const availableStock = matchingInventory ? matchingInventory.availableQuantity : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!sourceWarehouseId || !destinationWarehouseId || !productId) {
      setError('Please select source warehouse, destination warehouse, and product.');
      return;
    }

    if (sourceWarehouseId === destinationWarehouseId) {
      setError('Source and Destination warehouses cannot be the same.');
      return;
    }

    if (quantity === '' || Number(quantity) <= 0) {
      setError('Transfer quantity must be at least 1 unit.');
      return;
    }

    if (Number(quantity) > availableStock) {
      setError(`Cannot transfer ${quantity} units. Only ${availableStock} units available at source warehouse.`);
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        sourceWarehouseId: Number(sourceWarehouseId),
        destinationWarehouseId: Number(destinationWarehouseId),
        productId: Number(productId),
        quantity: Number(quantity),
        reason: reason.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Transfer failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-lg w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Inter-Warehouse Stock Transfer</h3>
              <p className="text-[11px] text-slate-400">Atomic dual-ledger inventory transfer with deadlock prevention</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Source Warehouse *
              </label>
              <select
                value={sourceWarehouseId}
                onChange={(e) => setSourceWarehouseId(Number(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-all"
                required
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id} className="bg-slate-900 text-slate-200">
                    {wh.name} ({wh.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Destination Warehouse *
              </label>
              <select
                value={destinationWarehouseId}
                onChange={(e) => setDestinationWarehouseId(Number(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-all"
                required
              >
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id} disabled={wh.id === Number(sourceWarehouseId)} className="bg-slate-900 text-slate-200">
                    {wh.name} ({wh.city}) {wh.id === Number(sourceWarehouseId) ? '(Source)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Select Product SKU *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-all"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Live Available Stock Indicator */}
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-indigo-400">
              <Info className="h-4 w-4 shrink-0" />
              <span>Available Stock at Source:</span>
            </div>
            <div className="font-bold text-sm font-mono text-white">
              {availableStock} units
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Transfer Quantity (Max: {availableStock}) *
            </label>
            <input
              type="number"
              min="1"
              max={availableStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g. 20"
              disabled={saving || availableStock === 0}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Transfer Reason / Note
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Stock rebalancing for peak regional demand"
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || availableStock === 0}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Transferring...</span>
                </>
              ) : (
                <span>Execute Transfer</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
