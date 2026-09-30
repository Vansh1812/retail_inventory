import React from 'react';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { Breadcrumbs } from './Breadcrumbs';

interface AppLayoutProps {
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  onRefreshHealth: () => void;
  isRefreshing: boolean;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  connectionStatus,
  onRefreshHealth,
  isRefreshing,
  currentTab,
  onSelectTab,
  children,
}) => {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-indigo-500 selection:text-white relative">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-950/20 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-emerald-950/15 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <Sidebar currentTab={currentTab} onSelectTab={onSelectTab} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Top Navbar */}
        <TopNavbar
          connectionStatus={connectionStatus}
          onRefreshHealth={onRefreshHealth}
          isRefreshing={isRefreshing}
          onNavigateToTab={onSelectTab}
        />

        {/* Breadcrumbs */}
        <Breadcrumbs currentTab={currentTab} />

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950/40 to-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
