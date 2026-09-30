import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminUsers, updateUserRoles, toggleUserStatus } from '../../api/admin';
import { AdminUser } from '../../types/admin';
import {
  Search,
  RefreshCw,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const UsersManagementPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);

  // Status alerts
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Role Edit Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [modalRoles, setModalRoles] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState<boolean>(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const availableRoles = [
    { name: 'ADMIN', label: 'Administrator', desc: 'Full unrestricted system administration' },
    { name: 'INVENTORY_MANAGER', label: 'Inventory Manager', desc: 'Stock ledgers, product catalog & adjustments' },
    { name: 'WAREHOUSE_MANAGER', label: 'Warehouse Manager', desc: 'Physical hubs, stock audits & transfers' },
    { name: 'PROCUREMENT_MANAGER', label: 'Procurement Manager', desc: 'Suppliers, purchase orders & receiving' },
    { name: 'ORDER_MANAGER', label: 'Order Manager', desc: 'Fulfillment pipeline & reservations' },
  ];

  const loadUsers = useCallback(async (targetPage: number = 0, query: string = search) => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers(targetPage, 10, query);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({ type: 'error', message: errObj.message || 'Failed to load user directory.' });
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadUsers(0, '');
  }, [loadUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(0, search);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    setTogglingId(user.id);
    setAlert(null);
    try {
      const updated = await toggleUserStatus(user.id);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      setAlert({
        type: 'success',
        message: `User '${user.username}' successfully ${updated.isActive ? 'activated' : 'deactivated'}.`,
      });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({
        type: 'error',
        message: errObj.message || 'Could not update user status.',
      });
    } finally {
      setTogglingId(null);
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    setModalRoles(user.roles.map(r => r.replace(/^ROLE_/, '')));
    setAlert(null);
  };

  const toggleModalRole = (roleName: string) => {
    setModalRoles(prev =>
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    );
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    if (modalRoles.length === 0) {
      setAlert({ type: 'error', message: 'User must be assigned at least one system role.' });
      return;
    }

    setSavingRoles(true);
    setAlert(null);
    try {
      const updated = await updateUserRoles(selectedUser.id, modalRoles);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      setSelectedUser(null);
      setAlert({
        type: 'success',
        message: `Updated roles for '${updated.username}' to [${updated.roles.join(', ')}].`,
      });
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setAlert({
        type: 'error',
        message: errObj.message || 'Failed to update roles.',
      });
    } finally {
      setSavingRoles(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    const clean = role.replace(/^ROLE_/, '');
    switch (clean) {
      case 'ADMIN':
        return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
      case 'INVENTORY_MANAGER':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
      case 'WAREHOUSE_MANAGER':
        return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
      case 'PROCUREMENT_MANAGER':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'ORDER_MANAGER':
        return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Administration
            </span>
            <span className="text-xs text-slate-400">Security &amp; RBAC Control</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">
            User Directory &amp; Permissions
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage enterprise accounts, assign functional roles, and control active login status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadUsers(page, search)}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-xs ${
            alert.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {alert.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, username, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </form>

        <div className="text-xs text-slate-400 font-medium">
          Showing <span className="font-bold text-slate-200">{users.length}</span> of{' '}
          <span className="font-bold text-slate-200">{totalElements}</span> registered users
        </div>
      </div>

      {/* Users Data Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">User ID</th>
                <th className="py-3.5 px-6">User Profile</th>
                <th className="py-3.5 px-6">Work Email</th>
                <th className="py-3.5 px-6">Assigned Roles</th>
                <th className="py-3.5 px-6 text-center">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                      <span>Loading user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching your criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-indigo-400 font-medium">
                      #{u.id}
                    </td>

                    {/* User Profile */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {u.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-4 px-6 font-mono text-slate-300">
                      {u.email}
                    </td>

                    {/* Roles Chips */}
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {u.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getRoleBadgeClass(
                              r
                            )}`}
                          >
                            {r.replace(/^ROLE_/, '')}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Toggle Switch */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={togglingId === u.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold transition-all border ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-850 text-slate-400 border-slate-700/60 hover:bg-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.isActive ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                        <span>{u.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => openRoleModal(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 hover:bg-indigo-600 hover:text-white border border-slate-700/60 rounded-xl text-slate-200 font-semibold transition-all shadow-xs"
                      >
                        <Edit2 className="h-3 w-3" />
                        <span>Edit Roles</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Page <span className="font-semibold text-slate-200">{page + 1}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalPages || 1}</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadUsers(page - 1)}
              disabled={page <= 0 || loading}
              className="p-1.5 bg-slate-850 border border-slate-700/60 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => loadUsers(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 bg-slate-850 border border-slate-700/60 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Roles Modal Dialog */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/95 border border-slate-800/90 rounded-2xl max-w-lg w-full p-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Assigned Roles</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    User: @{selectedUser.username} ({selectedUser.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="py-5 space-y-2.5">
              <p className="text-xs text-slate-400 mb-3">
                Check the functional roles this user should be granted. Changes take effect on next API request:
              </p>

              {availableRoles.map((role) => {
                const isChecked = modalRoles.includes(role.name);
                return (
                  <div
                    key={role.name}
                    onClick={() => toggleModalRole(role.name)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'border-indigo-500/60 bg-indigo-500/10 shadow-inner'
                        : 'border-slate-800 bg-slate-950/50 hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-700 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{role.label}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                          {role.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{role.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-slate-700/80 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRoles}
                disabled={savingRoles}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                {savingRoles ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <span>Update Permissions</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
