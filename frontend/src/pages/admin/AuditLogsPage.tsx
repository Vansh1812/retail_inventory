import React, { useState, useEffect, useCallback } from 'react';
import { fetchAuditLogs } from '../../api/admin';
import { AuditLogEntry } from '../../types/admin';
import {
  FileText,
  RefreshCw,
  Clock,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAuditLogs = useCallback(async (targetPage: number = 0) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchAuditLogs(targetPage, 12);
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (err: unknown) {
      const errObj = err as { message?: string };
      setErrorMessage(errObj.message || 'Failed to fetch audit log trail.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAuditLogs(0);
  }, [loadAuditLogs]);

  const getActionBadge = (action: string) => {
    if (action.includes('ROLES')) {
      return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
    }
    if (action.includes('ACTIVAT')) {
      return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    }
    if (action.includes('DEACTIVAT')) {
      return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    }
    if (action.includes('REGISTER')) {
      return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center gap-1.5">
              <Activity className="h-3 w-3 text-indigo-400" />
              <span>Immutable Ledger</span>
            </span>
            <span className="text-xs text-slate-400">Security &amp; Compliance Audit</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">
            System Activity &amp; Audit Logs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Read-only chronological trail of administrative actions, role assignments, and security operations.
          </p>
        </div>

        <button
          onClick={() => loadAuditLogs(page)}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/60 text-slate-200 rounded-xl text-xs font-semibold transition-all shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
          {errorMessage}
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Security Audit Activity ({totalElements} Events)
            </h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Retention: Indefinite</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-6">ID</th>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-6">Administrator</th>
                <th className="py-3.5 px-6">Action Performed</th>
                <th className="py-3.5 px-6">Target Entity</th>
                <th className="py-3.5 px-6">Details / Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-6 w-6 animate-spin text-indigo-400" />
                      <span>Loading audit entries...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records recorded yet. Administrative changes will automatically stream here.
                  </td>
                </tr>
              ) : (
                logs.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono text-indigo-400">
                      #{entry.id}
                    </td>

                    <td className="py-4 px-6 whitespace-nowrap text-slate-300">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center gap-1.5 font-semibold text-white">
                        <UserCheck className="h-3.5 w-3.5 text-indigo-400" />
                        <span>@{entry.performedBy}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold border ${getActionBadge(
                          entry.action
                        )}`}
                      >
                        {entry.action}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-200">
                      <span className="font-semibold text-white">{entry.entityName}</span>
                      {entry.entityId && (
                        <span className="font-mono text-slate-400 ml-1.5">#{entry.entityId}</span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-slate-300 max-w-md">
                      <div className="truncate font-mono text-[11px] bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-slate-300">
                        {entry.details || 'No additional details'}
                      </div>
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
              onClick={() => loadAuditLogs(page - 1)}
              disabled={page <= 0 || loading}
              className="p-1.5 bg-slate-850 border border-slate-700/60 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => loadAuditLogs(page + 1)}
              disabled={page >= totalPages - 1 || loading}
              className="p-1.5 bg-slate-850 border border-slate-700/60 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
