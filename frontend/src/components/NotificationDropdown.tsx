import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Info,
  Clock,
} from 'lucide-react';
import {
  NotificationDto,
  NotificationType,
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../api/notifications';
import { useAuth } from '../context/AuthContext';

interface NotificationDropdownProps {
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigateToTab }) => {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // ignore
    }
  };

  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const list = await fetchNotifications(filter === 'unread');
      setNotifications(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, filter]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'LOW_STOCK':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'NEW_ORDER':
        return <ShoppingCart className="h-4 w-4 text-indigo-400" />;
      case 'PO_STATUS':
        return <Truck className="h-4 w-4 text-cyan-400" />;
      case 'SYSTEM_ALERT':
      default:
        return <Info className="h-4 w-4 text-rose-400" />;
    }
  };

  const getNotificationBadgeColor = (type: NotificationType) => {
    switch (type) {
      case 'LOW_STOCK':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'NEW_ORDER':
        return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30';
      case 'PO_STATUS':
        return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
      case 'SYSTEM_ALERT':
      default:
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const handleNotificationClick = (item: NotificationDto) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }
    if (onNavigateToTab) {
      if (item.type === 'LOW_STOCK') {
        onNavigateToTab('inventory');
      } else if (item.type === 'NEW_ORDER') {
        onNavigateToTab('orders');
      } else if (item.type === 'PO_STATUS') {
        onNavigateToTab('procurement');
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button with Pulsing Dot */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-900/80 rounded-xl transition-all focus:outline-hidden cursor-pointer border border-transparent hover:border-slate-800"
        title="Notifications & Alerts"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-lg shadow-rose-500/50">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative">{unreadCount > 99 ? '99+' : unreadCount}</span>
          </span>
        )}
      </button>

      {/* Modern Frosted Dark Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-96 max-w-[92vw] rounded-2xl bg-slate-900/95 border border-slate-700/70 shadow-2xl backdrop-blur-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-wide text-white">SYSTEM ALERTS</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 p-1 transition-colors cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex border-b border-slate-800 px-3 bg-slate-950/30 text-xs font-medium">
            <button
              onClick={() => setFilter('unread')}
              className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                filter === 'unread'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-3 border-b-2 transition-colors cursor-pointer ${
                filter === 'all'
                  ? 'border-indigo-500 text-indigo-400 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              All Logs
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-300">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications found'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  System alerts, low stock warnings, and order updates will show here.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                    !item.isRead ? 'bg-indigo-950/20 hover:bg-indigo-950/30' : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Type Icon */}
                  <div className="mt-0.5 shrink-0 p-2 rounded-xl bg-slate-800/70 border border-slate-700/60">
                    {getNotificationIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded border ${getNotificationBadgeColor(
                            item.type
                          )}`}
                        >
                          {item.type.replace('_', ' ')}
                        </span>
                        {item.referenceId && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 rounded">
                            {item.referenceId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1 whitespace-nowrap font-mono">
                        <Clock className="h-3 w-3" />
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-200 line-clamp-1">{item.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {/* Unread indicator */}
                  {!item.isRead && (
                    <div className="flex flex-col justify-between items-end shrink-0">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500 mt-1" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(item.id);
                        }}
                        className="text-[10px] text-slate-400 hover:text-indigo-400 p-0.5 cursor-pointer"
                        title="Mark read"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-slate-800 bg-slate-950/60 text-center">
            <span className="text-[10px] font-mono text-slate-400">
              Auto-synced with ACID event bus
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
