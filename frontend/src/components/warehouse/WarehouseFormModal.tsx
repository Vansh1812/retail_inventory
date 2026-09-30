import React, { useState, useEffect } from 'react';
import { Warehouse, WarehouseFormData, WarehouseStatus } from '../../types/warehouse';
import { X, Warehouse as WarehouseIcon, RefreshCw, AlertCircle } from 'lucide-react';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WarehouseFormData) => Promise<void>;
  initialWarehouse?: Warehouse | null;
}

export const WarehouseFormModal: React.FC<WarehouseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialWarehouse,
}) => {
  const [formData, setFormData] = useState<WarehouseFormData>({
    name: '',
    address: '',
    city: '',
    capacity: '',
    managerName: '',
    status: 'ACTIVE',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialWarehouse) {
      setFormData({
        name: initialWarehouse.name,
        address: initialWarehouse.address,
        city: initialWarehouse.city,
        capacity: initialWarehouse.capacity,
        managerName: initialWarehouse.managerName || '',
        status: initialWarehouse.status,
      });
    } else {
      setFormData({
        name: '',
        address: '',
        city: '',
        capacity: 100000,
        managerName: '',
        status: 'ACTIVE',
      });
    }
    setError(null);
  }, [initialWarehouse, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Warehouse Name is required.');
      return;
    }

    if (!formData.address.trim()) {
      setError('Street address is required.');
      return;
    }

    if (!formData.city.trim()) {
      setError('City is required.');
      return;
    }

    if (formData.capacity === '' || Number(formData.capacity) < 0) {
      setError('Capacity must be 0 or greater.');
      return;
    }

    setSaving(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        capacity: Number(formData.capacity),
        managerName: formData.managerName.trim(),
        status: formData.status,
      });
      onClose();
    } catch (err: unknown) {
      const errObj = err as { message?: string; data?: Record<string, string> };
      let msg = errObj.message || 'Failed to save warehouse.';
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
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/90 max-w-lg w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {initialWarehouse ? `Edit Warehouse: ${initialWarehouse.name}` : 'Register New Warehouse'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {initialWarehouse ? 'Update facility location, capacity and assigned manager' : 'Define an active logistics hub or fulfillment facility'}
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
          {/* Warehouse Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Warehouse Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Central Logistics Hub"
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              required
            />
          </div>

          {/* City & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                City / Region *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="e.g. Chicago"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Total Storage Capacity (Units) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value === '' ? '' : Number(e.target.value) })}
                placeholder="100000"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono text-indigo-400 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
                required
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Street Address / Dock Details *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. 1000 Industrial Parkway, Dock 1-12"
              disabled={saving}
              className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              required
            />
          </div>

          {/* Manager & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Warehouse Manager
              </label>
              <input
                type="text"
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                placeholder="e.g. Marcus Vance"
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Facility Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as WarehouseStatus })}
                disabled={saving}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
              >
                <option value="ACTIVE" className="bg-slate-900 text-slate-200">ACTIVE (Accepts Stock &amp; Fulfillments)</option>
                <option value="INACTIVE" className="bg-slate-900 text-slate-200">INACTIVE (Decommissioned / Maintenance)</option>
              </select>
            </div>
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
                  <span>Saving Facility...</span>
                </>
              ) : (
                <span>{initialWarehouse ? 'Update Warehouse' : 'Register Warehouse'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
