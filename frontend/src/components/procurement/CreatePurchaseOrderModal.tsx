import React, { useState, useEffect } from 'react';
import { Warehouse } from '../../types/warehouse';
import { Product } from '../../types/catalog';
import { Supplier, PurchaseOrderFormData, PurchaseOrderItemRequest } from '../../types/procurement';
import { X, Plus, Trash2, ShoppingCart, RefreshCw, AlertCircle } from 'lucide-react';

interface CreatePurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PurchaseOrderFormData) => Promise<void>;
  suppliers: Supplier[];
  warehouses: Warehouse[];
  products: Product[];
}

export const CreatePurchaseOrderModal: React.FC<CreatePurchaseOrderModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  warehouses,
  products,
}) => {
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [warehouseId, setWarehouseId] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<PurchaseOrderItemRequest[]>([]);

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suppliers.length > 0) setSupplierId(suppliers[0].id);
    if (warehouses.length > 0) setWarehouseId(warehouses[0].id);
    if (products.length > 0) {
      setItems([
        {
          productId: products[0].id,
          quantity: 25,
          unitCost: products[0].costPrice || 10,
        },
      ]);
    } else {
      setItems([]);
    }
    setNotes('');
    setError(null);
  }, [suppliers, warehouses, products, isOpen]);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    if (products.length === 0) return;
    setItems([
      ...items,
      {
        productId: products[0].id,
        quantity: 10,
        unitCost: products[0].costPrice || 10,
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseOrderItemRequest, value: unknown) => {
    const updated = [...items];
    if (field === 'productId') {
      const prodId = Number(value);
      const prod = products.find((p) => p.id === prodId);
      updated[index] = {
        ...updated[index],
        productId: prodId,
        unitCost: prod ? prod.costPrice : updated[index].unitCost,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  // Real-time calculated grand total
  const calculatedGrandTotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const cost = Number(item.unitCost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!supplierId) {
      setError('Please select a supplier.');
      return;
    }
    if (!warehouseId) {
      setError('Please select a destination warehouse.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one line item to the purchase order.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productId || !it.quantity || Number(it.quantity) <= 0 || !it.unitCost || Number(it.unitCost) <= 0) {
        setError(`Line #${i + 1} has invalid quantity or unit cost.`);
        return;
      }
    }

    setSaving(true);
    try {
      await onSubmit({
        supplierId: Number(supplierId),
        warehouseId: Number(warehouseId),
        notes: notes.trim(),
        items: items.map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitCost: Number(it.unitCost),
        })),
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setError(errObj.message || 'Failed to create purchase order.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-2xl w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Create Purchase Order (PO)</h3>
              <p className="text-[11px] text-slate-400">Procure inventory from authorized vendors into physical fulfillment hubs</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs shrink-0">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Vendor / Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 transition-all"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                    {s.name} ({s.contactPerson || 'Vendor'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Destination Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
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
          </div>

          {/* Dynamic Item Rows */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Line Items ({items.length})
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                disabled={saving || products.length === 0}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2.5 mt-2.5">
              {items.map((item, index) => {
                const subtotal = (Number(item.quantity) || 0) * (Number(item.unitCost) || 0);

                return (
                  <div
                    key={index}
                    className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl grid grid-cols-12 gap-2.5 items-center"
                  >
                    <div className="col-span-5">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Product SKU</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        disabled={saving}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500"
                        required
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                            {p.sku} - {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                        disabled={saving}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.unitCost}
                        onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                        placeholder="Cost"
                        disabled={saving}
                        className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="col-span-2 text-right">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">Subtotal</label>
                      <span className="font-mono text-xs font-bold text-white">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="col-span-1 text-center pt-3">
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItemRow(index)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Procurement Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Expedited freight shipment, net 30 invoice terms"
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Grand Total Bar */}
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Total Purchase Order Value:</span>
            <span className="text-lg font-black font-mono text-indigo-400">
              ${calculatedGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3 shrink-0">
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
              disabled={saving || items.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting PO...</span>
                </>
              ) : (
                <span>Create Purchase Order</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
