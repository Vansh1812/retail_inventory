import React, { useState, useEffect } from 'react';
import { Category, Product, ProductFormData, ProductStatus } from '../../types/catalog';
import { X, Package, RefreshCw, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  initialProduct?: Product | null;
  categories: Category[];
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    categoryId: '',
    description: '',
    costPrice: '',
    sellingPrice: '',
    reorderLevel: 10,
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setFormData({
        sku: initialProduct.sku,
        name: initialProduct.name,
        categoryId: initialProduct.categoryId,
        description: initialProduct.description || '',
        costPrice: initialProduct.costPrice,
        sellingPrice: initialProduct.sellingPrice,
        reorderLevel: initialProduct.reorderLevel,
        status: initialProduct.status,
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        categoryId: categories.length > 0 ? categories[0].id : '',
        description: '',
        costPrice: '',
        sellingPrice: '',
        reorderLevel: 10,
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [initialProduct, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.sku.trim() || !formData.name.trim()) {
      setError('SKU and Product Name are required.');
      return;
    }

    if (!formData.categoryId) {
      setError('Please select a valid product category.');
      return;
    }

    if (formData.costPrice === '' || Number(formData.costPrice) < 0) {
      setError('Cost Price must be 0 or greater.');
      return;
    }

    if (formData.sellingPrice === '' || Number(formData.sellingPrice) < 0) {
      setError('Selling Price must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        ...formData,
        sku: formData.sku.trim().toUpperCase(),
        name: formData.name.trim(),
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        reorderLevel: Number(formData.reorderLevel) || 0,
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string; data?: Record<string, string> };
      let msg = errObj.message || 'Failed to save product.';
      if (errObj.data && typeof errObj.data === 'object') {
        const fieldMsgs = Object.values(errObj.data).join(', ');
        if (fieldMsgs) msg = `${msg}: ${fieldMsgs}`;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-xl w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {initialProduct ? `Edit Product: ${initialProduct.sku}` : 'Add New Product to Catalog'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {initialProduct ? 'Update SKU details, pricing, and reorder threshold' : 'Register a new SKU across all warehouse locations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{error}</div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {/* SKU and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                SKU Code *
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                placeholder="e.g. SKU-ELEC-MBP15"
                disabled={saving || !!initialProduct}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono font-semibold text-indigo-400 uppercase placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Pro Laptop 15-inch M3"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Operational Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductStatus })}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="ACTIVE" className="bg-slate-900 text-slate-200">ACTIVE (Available for sale &amp; orders)</option>
                <option value="INACTIVE" className="bg-slate-900 text-slate-200">INACTIVE (Discontinued / Hidden)</option>
              </select>
            </div>
          </div>

          {/* Pricing & Reorder Threshold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Cost Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0.00"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Selling Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="0.00"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reorder Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                placeholder="10"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description / Specs
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed technical specifications, packaging size, or customer notes..."
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>

          {/* Actions */}
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
              className="px-5 py-2 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Saving SKU...</span>
                </>
              ) : (
                <span>{initialProduct ? 'Update Product' : 'Add to Catalog'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
