import React from 'react';
import { User, Mail, MapPin, Phone, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const CustomerProfilePage: React.FC<{ onNavigateToOrders?: () => void }> = ({ onNavigateToOrders }) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-slate-900/50 backdrop-blur-xl p-6 rounded-2xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xl shadow-inner">
            {user?.username ? user.username.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Customer Profile &amp; Preferences</h1>
            <p className="text-xs text-slate-400 mt-1">Manage your self-service account, contact info, and default shipping addresses.</p>
          </div>
        </div>

        {onNavigateToOrders && (
          <button
            onClick={onNavigateToOrders}
            className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>View My Orders</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Account Credentials</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Username</span>
                <p className="font-bold text-white mt-0.5">{user?.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
              <Mail className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Email</span>
                <p className="font-bold text-white mt-0.5">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Account Role</span>
                <p className="font-bold text-emerald-400 mt-0.5">Verified Customer (Self-Service)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 hover:border-slate-700/80 transition-all space-y-4">
          <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Shipping &amp; Delivery Destination</h2>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Primary Shipping Address</span>
                <p className="font-semibold text-slate-200 mt-0.5">
                  742 Evergreen Terrace, Springfield, OR 97477
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
              <Phone className="w-4 h-4 text-slate-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Contact Phone</span>
                <p className="font-semibold text-slate-200 mt-0.5">+1-555-0349</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
