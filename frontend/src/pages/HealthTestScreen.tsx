import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/axios';
import { ApiResponse, HealthStatus } from '../types/api';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Server,
  Database,
  Clock,
  Code,
  Play,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface HealthTestScreenProps {
  onStatusChange?: (status: 'connected' | 'disconnected' | 'checking') => void;
}

export const HealthTestScreen: React.FC<HealthTestScreenProps> = ({ onStatusChange }) => {
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [rawResponse, setRawResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Exception simulation testing state
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulatedResult, setSimulatedResult] = useState<{
    endpoint: string;
    status: number | string;
    payload: unknown;
  } | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    onStatusChange?.('checking');
    const start = performance.now();

    try {
      const response = await apiClient.get<ApiResponse<HealthStatus>>('/health');
      const latency = Math.round(performance.now() - start);
      setPingLatency(latency);
      setHealthData(response.data.data);
      setRawResponse(JSON.stringify(response.data, null, 2));
      onStatusChange?.('connected');
    } catch (err: unknown) {
      const errObj = err as { message?: string; status?: number; data?: unknown };
      const errorMessage = errObj.message || 'Failed to connect to backend server at http://localhost:8080';
      setError(errorMessage);
      setRawResponse(JSON.stringify(errObj, null, 2));
      onStatusChange?.('disconnected');
    } finally {
      setLoading(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const testErrorSimulation = async (type: string) => {
    setSimulating(true);
    setSimulatedResult(null);

    try {
      const response = await apiClient.get(`/health/simulate-error?type=${type}`);
      setSimulatedResult({
        endpoint: `/api/health/simulate-error?type=${type}`,
        status: 200,
        payload: response.data,
      });
    } catch (err: unknown) {
      const errObj = err as { status?: number; message?: string; data?: unknown };
      setSimulatedResult({
        endpoint: `/api/health/simulate-error?type=${type}`,
        status: errObj.status || 'Error',
        payload: {
          message: errObj.message,
          data: errObj.data,
        },
      });
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Step 1 Verification
              </span>
              <span className="text-xs text-slate-400">Foundation &amp; Error Handling</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-2">
              System Architecture &amp; Health Diagnostics
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Verifies communication between React 19 Frontend and Spring Boot 3.3 Backend through HikariCP &amp; PostgreSQL.
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Play className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Pinging API...' : 'Ping GET /api/health'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Backend Status
            </span>
            {healthData ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : error ? (
              <XCircle className="h-5 w-5 text-rose-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            )}
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">
              {loading ? 'Checking...' : healthData?.status || (error ? 'OFFLINE' : 'UNKNOWN')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {healthData ? 'Spring Boot 3.3 runtime active' : error ? 'Backend server not responding' : 'Initializing...'}
            </p>
          </div>
        </div>

        {/* Latency Card */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Roundtrip Latency
            </span>
            <Clock className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-400">
              {pingLatency !== null ? `${pingLatency} ms` : '--'}
            </div>
            <p className="text-xs text-slate-400 mt-1">Vite Proxy &rarr; Spring Controller</p>
          </div>
        </div>

        {/* Database Connection */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Connection Pool
            </span>
            <Database className="h-5 w-5 text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">HikariCP</div>
            <p className="text-xs text-slate-400 mt-1">PostgreSQL 16 pool (max 15)</p>
          </div>
        </div>

        {/* Architecture */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-5 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Monolith Pattern
            </span>
            <Layers className="h-5 w-5 text-purple-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white">Modular</div>
            <p className="text-xs text-slate-400 mt-1">ACID Relational Ledgers</p>
          </div>
        </div>
      </div>

      {/* Live Response & Exception Handler Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Raw Response Viewer */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code className="h-4 w-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Standardized ApiResponse&lt;T&gt; Inspector
              </h2>
            </div>
            <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
              GET /api/health
            </span>
          </div>

          <div className="p-4 flex-1">
            {loading ? (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
                Pinging endpoint...
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
                <div className="font-semibold mb-1">Connection Error</div>
                <div>{error}</div>
                <div className="mt-2 text-[11px] text-rose-400">
                  Tip: Start the backend server (`./mvnw spring-boot:run` or `mvnw.cmd spring-boot:run`) to connect.
                </div>
              </div>
            ) : (
              <pre className="bg-slate-950/80 text-slate-200 border border-slate-800/80 p-4 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed">
                {rawResponse}
              </pre>
            )}
          </div>
        </div>

        {/* Global Exception Handler Simulator */}
        <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 shadow-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Exception Handler Simulator
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">@RestControllerAdvice</span>
          </div>

          <div className="p-4 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Test how the backend&apos;s custom domain exceptions are captured and converted into standardized API responses:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => testErrorSimulation('not_found')}
                disabled={simulating}
                className="px-3.5 py-2.5 text-left bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>ResourceNotFound</span>
                <span className="text-[10px] text-amber-400 font-mono">404</span>
              </button>

              <button
                onClick={() => testErrorSimulation('stock')}
                disabled={simulating}
                className="px-3.5 py-2.5 text-left bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>InsufficientStock</span>
                <span className="text-[10px] text-rose-400 font-mono">400</span>
              </button>

              <button
                onClick={() => testErrorSimulation('validation')}
                disabled={simulating}
                className="px-3.5 py-2.5 text-left bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>ValidationException</span>
                <span className="text-[10px] text-blue-400 font-mono">400</span>
              </button>

              <button
                onClick={() => testErrorSimulation('server_error')}
                disabled={simulating}
                className="px-3.5 py-2.5 text-left bg-slate-950/50 hover:bg-slate-800/40 border border-slate-800 rounded-xl text-xs font-medium text-slate-200 transition-colors flex items-center justify-between"
              >
                <span>Generic 500 Error</span>
                <span className="text-[10px] text-purple-400 font-mono">500</span>
              </button>
            </div>

            {simulatedResult && (
              <div className="mt-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-slate-200 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5 mb-2 text-[11px]">
                  <span>Status: {simulatedResult.status}</span>
                  <span className="truncate max-w-[200px]">{simulatedResult.endpoint}</span>
                </div>
                <pre className="overflow-x-auto text-[11px] leading-relaxed">
                  {JSON.stringify(simulatedResult.payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Roadmap Next Steps */}
      <div className="bg-slate-900/50 backdrop-blur-md text-slate-200 rounded-2xl p-6 border border-slate-800/80 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-base font-semibold text-white">Ready for Next Modules</h3>
            <p className="text-xs text-slate-400 mt-1">
              Architecture baseline is active. Next in sequence: <strong className="text-slate-200">Authentication &amp; RBAC (JWT)</strong>, followed by <strong className="text-slate-200">Product Catalog</strong> and <strong className="text-slate-200">Inventory Engine</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
            <span>Next: Step 2</span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
