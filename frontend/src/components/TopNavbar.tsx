import React, { useState } from 'react';
import { User, LogOut, WifiOff, Search, Command } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

interface TopNavbarProps {
  connectionStatus?: 'connected' | 'disconnected' | 'checking';
  onRefreshHealth?: () => void;
  isRefreshing?: boolean;
  onNavigateToTab?: (tab: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  connectionStatus,
  onNavigateToTab,
}) => {
  const { user, logout } = useAuth();
  const primaryRole = user?.roles?.[0]?.replace(/^ROLE_/, '') || 'USER';
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !onNavigateToTab) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('order')) onNavigateToTab('orders');
    else if (q.includes('invent') || q.includes('stock')) onNavigateToTab('inventory');
    else if (q.includes('ware')) onNavigateToTab('warehouses');
    else if (q.includes('prod') || q.includes('cat')) onNavigateToTab('catalog');
    else if (q.includes('supp') || q.includes('po')) onNavigateToTab('procurement');
    else if (q.includes('user') || q.includes('perm')) onNavigateToTab('admin-users');
    else if (q.includes('rep') || q.includes('val')) onNavigateToTab('reports');
    else onNavigateToTab('catalog');
  };

  return (
    <header className="h-16 bg-slate-950/60 backdrop-blur-lg border-b border-slate-800/60 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Quick Search with ⌘K Badge */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKUs, orders, hubs or press..."
            className="w-full pl-9 pr-14 py-2 bg-slate-900/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded-md">
              <Command className="h-2.5 w-2.5" />
              <span>K</span>
            </kbd>
          </div>
        </form>
      </div>

      {/* Right Controls: Offline indicator, Notifications, User Profile */}
      <div className="flex items-center gap-3">
        {connectionStatus === 'disconnected' && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            <WifiOff className="h-3.5 w-3.5" />
            <span>Disconnected</span>
          </div>
        )}

        {/* Notifications Dropdown */}
        <NotificationDropdown onNavigateToTab={onNavigateToTab} />

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* User Info & Signout */}
        <div className="flex items-center gap-3 pl-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-xs shadow-inner">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden md:block text-left text-xs">
              <div className="font-semibold text-slate-200 leading-tight">
                {user?.username || 'Guest'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {primaryRole}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-800"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
