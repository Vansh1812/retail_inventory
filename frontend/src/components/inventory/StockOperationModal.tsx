import React, { useState, useEffect } from 'react';
import { Warehouse } from '../../types/warehouse';
import { Product } from '../../types/catalog';
import { InventoryItem } from '../../types/inventory';
import { X, ArrowDownRight, ArrowUpRight, Sliders, RefreshCw, AlertCircle } from 'lucide-react';

export type OperationType = 'IN' | 'OUT' | 'ADJUST';

interface StockOperationModalProps {
  isOpen: boolean;
  operationType: OperationType;
  onClose: () => void;
  onSubmit: (params: {
    productId: number;
    warehouseId: number;
    quantity?: number;
    newTotalQuantity?: number;
    reason: string;
    referenceId?: string;
  }) => Promise<void>;
  warehouses: Warehouse[];
  products: Product[];
  selectedItem?: InventoryItem | null;
  defaultWarehouseId?: number;
}

export const StockOperationModal: React.FC<StockOperationModalProps> = ({
  isOpen,
  operationType,
  onClose,
  onSubmit,
  warehouses,
  products,
  selectedItem,
  defaultWarehouseId,
}) => {
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [productId, setProductId] = useState<number | ''>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [newTotalQuantity, setNewTotalQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedItem) {
      setWarehouseId(selectedItem.warehouseId);
      setProductId(selectedItem.productId);
      if (operationType === 'ADJUST') {
        setNewTotalQuantity(selectedItem.totalQuantity);
      }
    } else {
      if (defaultWarehouseId) {
        setWarehouseId(defaultWarehouseId);
      } else if (warehouses.length > 0) {
        setWarehouseId(warehouses[0].id);
      }
      if (products.length > 0) {
        setProductId(products[0].id);
      }
      setNewTotalQuantity('');
    }
    setQuantity('');
    setReason('');
    setReferenceId('');
    setError(null);
  }, [selectedItem, operationType, warehouses, products, defaultWarehouseId, isOpen]);

  if (!isOpen) return null;

  const titleMap = {
    IN: 'Stock In Goods',
    OUT: 'Stock Out / Dispatch Goods',
    ADJUST: 'Audit & Adjust Total Stock',
  };

  const iconMap = {
    IN: ArrowDownRight,
    OUT: ArrowUpRight,
    ADJUST: Sliders,
  };

  const Icon = iconMap[operationType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!warehouseId || !productId) {
      setError('Please select both warehouse and product.');
      return;
    }

    if (operationType === 'ADJUST') {
      if (newTotalQuantity === '' || Number(newTotalQuantity) < 0) {
        setError('New total quantity must be 0 or greater.');
        return;
      }
      if (!reason.trim()) {
        setError('A reason is mandatory for stock adjustment audits.');
        return;
      }
    } else {
      if (quantity === '' || Number(quantity) <= 0) {
        setError('Quantity must be greater than zero.');
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit({
        productId: Number(productId),
        warehouseId: Number(warehouseId),
        quantity: quantity !== '' ? Number(quantity) : undefined,
        newTotalQuantity: newTotalQuantity !== '' ? Number(newTotalQuantity) : undefined,
        reason: reason.trim() || (operationType === 'IN' ? 'Manual stock-in' : 'Manual stock-out'),
        referenceId: referenceId.trim() || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-md w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
              operationType === 'IN'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : operationType === 'OUT'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{titleMap[operationType]}</h3>
              <p className="text-[11px] text-slate-400">
                {selectedItem ? `SKU: ${selectedItem.productSku} at ${selectedItem.warehouseName}` : 'Update stock quantity with ledger auditing'}
              </p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Warehouse Facility *
            </label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(Number(e.target.value))}
              disabled={saving || !!selectedItem}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
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
              Product SKU *
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(Number(e.target.value))}
              disabled={saving || !!selectedItem}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.sku} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs flex justify-between">
              <div>
                <span className="text-slate-400">Current Total:</span>{' '}
                <span className="font-bold text-white">{selectedItem.totalQuantity}</span>
              </div>
              <div>
                <span className="text-slate-400">Reserved:</span>{' '}
                <span className="font-bold text-amber-400">{selectedItem.reservedQuantity}</span>
              </div>
              <div>
                <span className="text-slate-400">Available:</span>{' '}
                <span className="font-bold text-emerald-400">{selectedItem.availableQuantity}</span>
              </div>
            </div>
          )}

          {operationType === 'ADJUST' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                New Total Quantity *
              </label>
              <input
                type="number"
                min="0"
                value={newTotalQuantity}
                onChange={(e) => setNewTotalQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Enter physical count"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {operationType === 'IN' ? 'Quantity to Add *' : 'Quantity to Dispatch *'}
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Reason / Note {operationType === 'ADJUST' ? '*' : ''}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                operationType === 'ADJUST'
                  ? 'e.g. Annual physical inventory reconciliation'
                  : 'e.g. Supplier delivery or replenishment'
              }
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              required={operationType === 'ADJUST'}
            />
          </div>

          {operationType !== 'ADJUST' && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reference ID (Optional)
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="e.g. PO-8902 or RMA-104"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          )}

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
              disabled={saving}
              className={`px-5 py-2 text-white rounded-xl text-xs font-semibold transition-all shadow-lg flex items-center gap-2 cursor-pointer ${
                operationType === 'IN'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
                  : operationType === 'OUT'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm {operationType === 'IN' ? 'Stock In' : operationType === 'OUT' ? 'Stock Out' : 'Adjustment'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
