import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Boxes,
  User,
  Power,
  Edit2,
  RefreshCw,
  X,
  CheckCircle2,
  AlertCircle,
  Warehouse as WarehouseIcon,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchWarehouses,
  createWarehouse,
  updateWarehouse,
  toggleWarehouseStatus,
} from '../../api/warehouses';
import { Warehouse, WarehouseFormData, WarehouseStatus } from '../../types/warehouse';
import { WarehouseFormModal } from '../../components/warehouse/WarehouseFormModal';
import { useAuth } from '../../context/AuthContext';

export const WarehousesListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageWarehouse = hasRole('ADMIN') || hasRole('WAREHOUSE_MANAGER');

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // User Notifications
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadWarehouses = async (searchTerm?: string, statusFilter?: string) => {
    try {
      setLoading(true);
      const data = await fetchWarehouses(statusFilter ? (statusFilter as WarehouseStatus) : '', searchTerm);
      setWarehouses(data);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({
        type: 'error',
        message: errObj.message || 'Failed to load warehouses.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      loadWarehouses(search || undefined, selectedStatus || undefined);
    }, 250);

    return () => clearTimeout(handler);
  }, [search, selectedStatus]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.status === 'ACTIVE').length;
    const inactive = total - active;
    const totalCapacity = warehouses.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    return { total, active, inactive, totalCapacity };
  }, [warehouses]);

  const handleOpenAddModal = () => {
    setEditingWarehouse(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (values: WarehouseFormData) => {
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, values);
        setAlert({
          type: 'success',
          message: `Warehouse '${values.name}' updated successfully.`,
        });
      } else {
        await createWarehouse(values);
        setAlert({
          type: 'success',
          message: `Warehouse '${values.name}' created successfully.`,
        });
      }
      setIsModalOpen(false);
      loadWarehouses(search || undefined, selectedStatus || undefined);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({
        type: 'error',
        message: errObj.message || 'Failed to save warehouse.',
      });
    }
  };

  const handleToggleStatus = async (warehouse: Warehouse) => {
    try {
      setTogglingId(warehouse.id);
      const updated = await toggleWarehouseStatus(warehouse.id);
      setWarehouses((prev) =>
        prev.map((w) => (w.id === updated.id ? updated : w))
      );
      setAlert({
        type: 'success',
        message: `Warehouse '${warehouse.name}' status set to ${updated.status}.`,
      });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({
        type: 'error',
        message: errObj.message || `Failed to change status of warehouse '${warehouse.name}'.`,
      });
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Header */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-indigo-400" />
            <span>Multi-Warehouse Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical distribution centers, regional depots, and total storage capacities.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadWarehouses()}
            disabled={loading}
            title="Refresh List"
            className="p-2.5 border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {canManageWarehouse && (
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register Warehouse</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Locations
          </div>
          <div className="mt-2 text-3xl font-bold text-white tracking-tight">{stats.total}</div>
          <div className="mt-1 text-xs text-slate-400">Registered nationwide hubs</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Facilities
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-400 tracking-tight">{stats.active}</div>
          <div className="mt-1 text-xs text-slate-400">Accepting stock &amp; orders</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Network Capacity
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-400 font-mono tracking-tight">
            {stats.totalCapacity.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-slate-400">Total units storage volume</div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Inactive / Maintenance
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-400 tracking-tight">{stats.inactive}</div>
          <div className="mt-1 text-xs text-slate-400">Decommissioned or idle</div>
        </div>
      </div>

      {/* Alert Notification */}
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
          <button
            onClick={() => setAlert(null)}
            className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Controls & Search Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by facility, city, or manager..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 self-stretch sm:self-auto bg-slate-900/80 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === ''
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setSelectedStatus('ACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === 'ACTIVE'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({stats.active})
          </button>
          <button
            onClick={() => setSelectedStatus('INACTIVE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedStatus === 'INACTIVE'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 font-medium'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Inactive ({stats.inactive})
          </button>
        </div>
      </div>

      {/* Warehouses Card Grid */}
      {loading ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-medium">Loading distribution hubs...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-12 text-center shadow-xl">
          <WarehouseIcon className="h-10 w-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-200">No Warehouses Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search || selectedStatus
              ? 'No facilities match your search query or status filter.'
              : 'There are currently no warehouses configured in the system.'}
          </p>
          {canManageWarehouse && !search && !selectedStatus && (
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Register First Warehouse</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map((wh) => {
            const isActive = wh.status === 'ACTIVE';
            const isToggling = togglingId === wh.id;

            return (
              <div
                key={wh.id}
                className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Icon + Name + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isActive
                            ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            : 'bg-slate-800/50 border-slate-700/60 text-slate-500'
                        }`}
                      >
                        <WarehouseIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-slate-100 font-semibold text-lg line-clamp-1">
                          {wh.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                          <span>{wh.city}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800/60 text-slate-400 border border-slate-700/60'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                        }`}
                      />
                      {wh.status}
                    </span>
                  </div>

                  {/* Street Address */}
                  <p className="text-xs text-slate-300 mt-3.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/50 line-clamp-2">
                    {wh.address}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/60 text-xs">
                    <div className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-xl">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Capacity
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Boxes className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-bold font-mono text-white text-sm">
                          {wh.capacity.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/50 border border-slate-800/50 p-3 rounded-xl">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Manager
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 truncate">
                        <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-200 truncate" title={wh.managerName || 'Unassigned'}>
                          {wh.managerName || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                {canManageWarehouse ? (
                  <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between gap-2">
                    {/* Toggle Active/Inactive Quick Action */}
                    <button
                      onClick={() => handleToggleStatus(wh)}
                      disabled={isToggling}
                      title={isActive ? 'Mark as Inactive' : 'Activate Facility'}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                        isActive
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {isToggling ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Power className="h-3.5 w-3.5" />
                      )}
                      <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    {/* Edit Details */}
                    <button
                      onClick={() => handleOpenEditModal(wh)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-700/70 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
                    <span>View-only mode (Admin/Warehouse Manager to modify)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warehouse Add/Edit Modal */}
      <WarehouseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialWarehouse={editingWarehouse}
      />
    </div>
  );
};
