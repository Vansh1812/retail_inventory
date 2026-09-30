import { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const RoleRoute = ({ children, requiredRole = 'ADMIN' }: RoleRouteProps) => {
  const { hasRole, isLoading, user } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!hasRole(requiredRole)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-72 h-72 rounded-full bg-rose-500/10 blur-[100px] pointer-events-none" />
        <div className="max-w-md w-full bg-slate-900/70 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-8 shadow-2xl relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
            <ShieldAlert className="h-8 w-8" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-3">
            <Lock className="h-3 w-3" />
            <span>403 Forbidden</span>
          </div>

          <h1 className="text-xl font-bold text-white">Access Denied</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This module is strictly restricted to system administrators with the <strong className="text-rose-300 font-mono">{requiredRole}</strong> role.
            Your current account (<strong className="text-slate-200">@{user?.username}</strong>) has permissions: {user?.roles?.map(r => r.replace(/^ROLE_/, '')).join(', ')}.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Workspace Overview</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
