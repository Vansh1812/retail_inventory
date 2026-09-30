import React, { useState, useEffect, useCallback } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier, toggleSupplierStatus } from '../../api/procurement';
import { Supplier, SupplierFormData, SupplierStatus } from '../../types/procurement';
import { SupplierFormModal } from '../../components/procurement/SupplierFormModal';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Power,
  Phone,
  Mail,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

export const SuppliersListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageSuppliers = hasRole('ADMIN') || hasRole('PROCUREMENT_MANAGER');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<SupplierStatus | ''>('');

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSuppliers(selectedStatus, search);
      setSuppliers(data);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to load suppliers' });
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, search]);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  const handleOpenAddModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: SupplierFormData) => {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, formData);
      setAlert({ type: 'success', message: `Supplier '${formData.name}' updated successfully!` });
    } else {
      await createSupplier(formData);
      setAlert({ type: 'success', message: `Supplier '${formData.name}' registered successfully!` });
    }
    loadSuppliers();
  };

  const handleToggleStatus = async (supplier: Supplier) => {
    try {
      await toggleSupplierStatus(supplier.id);
      setAlert({ type: 'success', message: `Supplier '${supplier.name}' status updated!` });
      loadSuppliers();
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to toggle status' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Truck className="h-6 w-6 text-indigo-400" />
            <span>Supplier Directory &amp; Vendor Master</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Certified vendors, supplier contacts, and authorized procurement sources.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadSuppliers()}
            disabled={loading}
            title="Refresh"
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {canManageSuppliers && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supplier</span>
            </button>
          )}
        </div>
      </div>

      {alert && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs backdrop-blur-md animate-in fade-in duration-200 ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor name, contact, or email..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === ''
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === 'ACTIVE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setSelectedStatus('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === 'INACTIVE'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-medium">Loading suppliers...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No Suppliers Found</h3>
            <p className="text-xs text-slate-400 mt-1">Register suppliers to begin placing purchase orders.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Vendor / Company</th>
                  <th className="px-5 py-3.5">Contact Person</th>
                  <th className="px-5 py-3.5">Communication</th>
                  <th className="px-5 py-3.5">Address</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  {canManageSuppliers && <th className="px-5 py-3.5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white">{s.name}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <User className="h-3.5 w-3.5 text-slate-500" />
                        <span>{s.contactPerson || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 space-y-1">
                      {s.email && (
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Mail className="h-3 w-3 text-slate-500" />
                          <span>{s.email}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-slate-500" />
                          <span>{s.phone}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-slate-400 text-[11px]">
                      <div className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
                        <span className="truncate">{s.address || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    {canManageSuppliers && (
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                            title="Edit Vendor"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(s)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              s.status === 'ACTIVE' ? 'text-slate-400 hover:text-amber-400 hover:bg-amber-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                            title={s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SupplierFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialSupplier={editingSupplier}
      />
    </div>
  );
};
