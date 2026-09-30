import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  Briefcase,
  Phone,
  MapPin,
  Activity,
  Server,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface MockEvent {
  id: string;
  time: string;
  badge: string;
  badgeColor: string;
  message: string;
}

export const LoginPage: React.FC = () => {
  // Tabs: 'signin' | 'customer_register' | 'staff_register'
  const [activeTab, setActiveTab] = useState<'signin' | 'customer_register' | 'staff_register'>('signin');

  // Sign In / Staff Register Form Fields
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('INVENTORY_MANAGER');

  // Customer Register Form Fields
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login, register, registerCustomer } = useAuth();
  const navigate = useNavigate();

  // Dynamic Telemetry Metrics State
  const [telemetry, setTelemetry] = useState({
    txRate: 146,
    latency: 12,
    activeHubs: 3,
    ledgerHash: '0x8f2a...c4e9',
    bufferHealth: '99.98%',
  });

  // Dynamic Event Stream State
  const [events, setEvents] = useState<MockEvent[]>([
    {
      id: 'evt-1',
      time: '11:51:02',
      badge: 'GRN INBOUND',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      message: 'PO-2026-00101 GRN received -> +70 units [Delhi Hub]',
    },
    {
      id: 'evt-2',
      time: '11:51:15',
      badge: 'ORDER LOCK',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
      message: 'ORD-2026-00084 confirmed -> stock reserved [Mumbai DC]',
    },
    {
      id: 'evt-3',
      time: '11:51:24',
      badge: 'DISPATCH',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      message: 'Transfer #TR-884 dispatched -> [Bengaluru Fulfillment]',
    },
  ]);

  const eventFeedRef = useRef<HTMLDivElement>(null);

  // Interval for live telemetry ticker updates
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        txRate: Math.floor(138 + Math.random() * 26),
        latency: Math.floor(10 + Math.random() * 5),
      }));
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Interval for simulated real-time event stream
  useEffect(() => {
    const mockEventsPool = [
      {
        badge: 'TRANSFER',
        badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        message: 'Rebalance #TR-902 complete: 40 SKUs [Delhi Hub -> Mumbai DC]',
      },
      {
        badge: 'RESERVATION',
        badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        message: 'Order ORD-2026-00091 locked -> safety threshold OK',
      },
      {
        badge: 'AUDIT',
        badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-200/20',
        message: 'Cycle count verified: 1,280 items in Bengaluru Aisle B-04',
      },
      {
        badge: 'DISPATCH',
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        message: 'Air Express dispatch manifest generated -> TRK-881903',
      },
      {
        badge: 'PO FULFILL',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        message: 'Supplier TechGadgets confirmed PO-2026-00108 acknowledge',
      },
    ];

    const eventInterval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(' ')[0];
      const randomItem = mockEventsPool[Math.floor(Math.random() * mockEventsPool.length)];

      setEvents((prev) => [
        {
          id: `evt-${Date.now()}`,
          time: timeStr,
          badge: randomItem.badge,
          badgeColor: randomItem.badgeColor,
          message: randomItem.message,
        },
        ...prev.slice(0, 4), // keep last 5
      ]);
    }, 4500);

    return () => clearInterval(eventInterval);
  }, []);

  const handlePostLoginRedirect = () => {
    try {
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const roles: string[] = parsed.roles || [];
        if (roles.some((r) => r.toUpperCase().includes('CUSTOMER'))) {
          navigate('/portal/customer/orders', { replace: true });
          return;
        }
        if (roles.some((r) => r.toUpperCase().includes('SUPPLIER'))) {
          navigate('/portal/supplier/purchase-orders', { replace: true });
          return;
        }
      }
    } catch {
      // ignore
    }
    navigate('/dashboard', { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (activeTab === 'signin') {
      if (!username.trim() || !password) {
        setErrorMessage('Please enter both your work email/username and password.');
        return;
      }
    } else if (activeTab === 'customer_register') {
      if (!customerName.trim() || !username.trim() || !email.trim() || !password) {
        setErrorMessage('Please fill in all required customer fields (Name, Username, Email, Password).');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    } else if (activeTab === 'staff_register') {
      if (!username.trim() || !email.trim() || !password) {
        setErrorMessage('Please fill in all required staff fields (Username, Email, Password).');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
    }

    setSubmitting(true);

    try {
      if (activeTab === 'signin') {
        await login(username.trim(), password);
      } else if (activeTab === 'customer_register') {
        await registerCustomer({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          name: customerName.trim(),
          phone: customerPhone.trim() || undefined,
          address: customerAddress.trim() || undefined,
        });
      } else if (activeTab === 'staff_register') {
        await register({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: selectedRole,
        });
      }

      handlePostLoginRedirect();
    } catch (err: unknown) {
      const errorObj = err as { message?: string; response?: { data?: { message?: string } } };
      setErrorMessage(
        errorObj.response?.data?.message ||
        errorObj.message ||
        'Operation failed. Please check your credentials or network.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Ambient Radial Mesh Gradients & Glow Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[620px] h-[620px] rounded-full bg-gradient-to-tr from-indigo-900/30 via-slate-900/20 to-emerald-900/10 blur-[130px] opacity-75" />
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-violet-900/25 via-indigo-950/20 to-slate-950 blur-[140px] opacity-70" />
        <div className="absolute -bottom-40 left-1/3 w-[520px] h-[520px] rounded-full bg-gradient-to-t from-emerald-950/20 via-slate-900/30 to-transparent blur-[120px] opacity-60" />
        {/* Subtle grid mesh overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Main Dual-Panel Viewport Layout */}
      <div className="relative z-10 w-full flex flex-col lg:flex-row min-h-screen">
        {/* LEFT PANEL: Dynamic Real-Time Platform Visualizer */}
        <div className="hidden lg:flex lg:w-7/12 xl:w-3/5 p-12 flex-col justify-between border-r border-slate-800/60 bg-gradient-to-b from-slate-950/80 via-slate-900/40 to-slate-950/90 backdrop-blur-md">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/20">
                <span className="text-xl font-black text-white leading-none tracking-tight">O</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-white">OmniStock</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/15 text-indigo-300 rounded-full border border-indigo-500/30">
                    Engine 2.0
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Enterprise Supply Chain &amp; IAM Platform</p>
              </div>
            </div>

            {/* Glowing SLA Status Pill Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 shadow-inner">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-medium text-[11px] tracking-wide text-slate-200">
                All Engine Services Online <span className="text-slate-500">•</span>{' '}
                <span className="text-emerald-400 font-semibold">{telemetry.bufferHealth} SLA</span>
              </span>
            </div>
          </div>

          {/* Center Visual Showcase */}
          <div className="my-auto py-8 space-y-6 max-w-2xl">
            <div className="space-y-2">
              <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300 leading-tight">
                High-Concurrency Inventory &amp; Multi-Node Distribution.
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
                Real-time synchronized ledger uniting system administrators, customer self-service order tracking, and vendor purchase order fulfillment under strict ACID constraints.
              </p>
            </div>

            {/* Interactive SVG Architecture & Dynamic Telemetry Canvas */}
            <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl overflow-hidden group">
              {/* Subtle top glare */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 tracking-wide">
                  <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span>DISTRIBUTED FULFILLMENT TOPOLOGY</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Server className="h-3 w-3 text-emerald-400" />
                    <span>3 Nodes Active</span>
                  </span>
                  <span>|</span>
                  <span className="text-indigo-400">Sync: {telemetry.latency}ms</span>
                </div>
              </div>

              {/* Animated Interactive SVG Nodes & Route Pulses */}
              <div className="relative h-48 w-full flex items-center justify-center">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 540 180"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="routeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="routeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="routeGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>

                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Connection Lines between Hubs */}
                  {/* Route 1: Delhi (90, 85) to Mumbai (270, 45) */}
                  <path
                    d="M 110 85 Q 190 40 250 50"
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 110 85 Q 190 40 250 50"
                    stroke="url(#routeGrad1)"
                    strokeWidth="2.5"
                    fill="none"
                    className="animate-dash"
                  />

                  {/* Route 2: Mumbai (270, 45) to Bengaluru (430, 105) */}
                  <path
                    d="M 290 50 Q 360 60 410 100"
                    stroke="#334155"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 290 50 Q 360 60 410 100"
                    stroke="url(#routeGrad2)"
                    strokeWidth="2.5"
                    fill="none"
                    className="animate-dash"
                  />

                  {/* Route 3: Delhi (110, 95) to Bengaluru (410, 115) Direct Trunk */}
                  <path
                    d="M 110 95 Q 260 170 410 115"
                    stroke="#1e293b"
                    strokeWidth="2"
                  />
                  <path
                    d="M 110 95 Q 260 170 410 115"
                    stroke="url(#routeGrad3)"
                    strokeWidth="2"
                    fill="none"
                    className="animate-dash-reverse"
                    opacity="0.6"
                  />

                  {/* Animated Simulated Moving Packets/Pulses */}
                  <circle r="4" fill="#60a5fa" filter="url(#glow)">
                    <animateMotion
                      path="M 110 85 Q 190 40 250 50"
                      dur="2.4s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3.5" fill="#34d399" filter="url(#glow)">
                    <animateMotion
                      path="M 290 50 Q 360 60 410 100"
                      dur="2.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  <circle r="3.5" fill="#a78bfa" filter="url(#glow)">
                    <animateMotion
                      path="M 410 115 Q 260 170 110 95"
                      dur="3.6s"
                      repeatCount="indefinite"
                    />
                  </circle>

                  {/* NODE 1: Delhi Hub */}
                  <g transform="translate(60, 55)">
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="60"
                      rx="12"
                      fill="#0f172a"
                      stroke="#4338ca"
                      strokeWidth="1.5"
                    />
                    <circle cx="16" cy="18" r="4" fill="#10b981" />
                    <text x="26" y="21" fill="#f8fafc" fontSize="10" fontWeight="bold">
                      Delhi Hub
                    </text>
                    <text x="12" y="38" fill="#94a3b8" fontSize="8">
                      Primary North
                    </text>
                    <text x="12" y="50" fill="#818cf8" fontSize="8" fontFamily="monospace">
                      98.4% Cap.
                    </text>
                  </g>

                  {/* NODE 2: Mumbai DC */}
                  <g transform="translate(225, 20)">
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="60"
                      rx="12"
                      fill="#0f172a"
                      stroke="#0891b2"
                      strokeWidth="1.5"
                    />
                    <circle cx="16" cy="18" r="4" fill="#06b6d4" />
                    <text x="26" y="21" fill="#f8fafc" fontSize="10" fontWeight="bold">
                      Mumbai DC
                    </text>
                    <text x="12" y="38" fill="#94a3b8" fontSize="8">
                      West Cross-Dock
                    </text>
                    <text x="12" y="50" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                      84.1% Cap.
                    </text>
                  </g>

                  {/* NODE 3: Bengaluru Fulfillment */}
                  <g transform="translate(385, 75)">
                    <rect
                      x="0"
                      y="0"
                      width="110"
                      height="60"
                      rx="12"
                      fill="#0f172a"
                      stroke="#059669"
                      strokeWidth="1.5"
                    />
                    <circle cx="16" cy="18" r="4" fill="#10b981" />
                    <text x="26" y="21" fill="#f8fafc" fontSize="10" fontWeight="bold">
                      Bengaluru Hub
                    </text>
                    <text x="12" y="38" fill="#94a3b8" fontSize="8">
                      South Fulfillment
                    </text>
                    <text x="12" y="50" fill="#34d399" fontSize="8" fontFamily="monospace">
                      79.0% Cap.
                    </text>
                  </g>
                </svg>
              </div>

              {/* Real-Time Micro-Metrics Ticker */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/60 mt-2">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Throughput</div>
                  <div className="text-base font-bold text-white mt-0.5 font-mono">
                    {telemetry.txRate} <span className="text-[10px] text-slate-400 font-sans">tx/sec</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Sync Latency</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5 font-mono">
                    {telemetry.latency}ms <span className="text-[10px] text-slate-400 font-sans">p99</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 uppercase font-medium">Ledger Status</div>
                  <div className="text-xs font-semibold text-indigo-300 mt-1 flex items-center gap-1 font-mono truncate">
                    <CheckCircle2 className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Event Stream Feed */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60 text-xs">
                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  <span>TRANSACTION LOG FEED (LIVE)</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  STREAMING
                </span>
              </div>

              <div ref={eventFeedRef} className="space-y-2 font-mono text-xs max-h-36 overflow-y-auto pr-1">
                {events.map((evt) => (
                  <div
                    key={evt.id}
                    className="flex items-start gap-2.5 p-1.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/40 transition-colors text-[11px]"
                  >
                    <span className="text-slate-500 shrink-0">[{evt.time}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded border text-[9px] font-bold uppercase shrink-0 ${evt.badgeColor}`}
                    >
                      {evt.badge}
                    </span>
                    <span className="text-slate-300 truncate">{evt.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-800/60">
            <span>&copy; {new Date().getFullYear()} OmniStock Global Systems Inc.</span>
            <div className="flex items-center gap-2 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-indigo-400" />
              <span>ACID Multi-Tenant Isolated Portals</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Frosted Glassmorphism Login Card */}
        <div className="w-full lg:w-5/12 xl:w-2/5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-14 overflow-y-auto">
          {/* Mobile Top Brand Header */}
          <div className="flex lg:hidden items-center justify-between pb-6">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
                <span className="text-base font-black text-white leading-none">O</span>
              </div>
              <div>
                <span className="font-bold text-white text-base">OmniStock</span>
                <span className="block text-[10px] text-slate-400">Enterprise Engine</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Online</span>
            </div>
          </div>

          {/* Frosted Glass Login Container */}
          <div className="my-auto max-w-md w-full mx-auto backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] shadow-2xl rounded-3xl p-6 sm:p-8 space-y-6">
            {/* Segmented Pill Container for Tabs */}
            <div className="flex p-1 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signin');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === 'signin'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('customer_register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === 'customer_register'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Customer Sign Up
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('staff_register');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
                  activeTab === 'staff_register'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Staff Access
              </button>
            </div>

            {/* Form Title & Subtitle */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                {activeTab === 'signin' && 'Welcome back'}
                {activeTab === 'customer_register' && 'Create Customer Account'}
                {activeTab === 'staff_register' && 'Internal Staff Register'}
              </h2>
              <p className="text-xs text-slate-400">
                {activeTab === 'signin' &&
                  'Enter your credentials to access your dedicated portal dashboard.'}
                {activeTab === 'customer_register' &&
                  'Self-place orders, manage shipping addresses, and track real-time delivery.'}
                {activeTab === 'staff_register' &&
                  'Onboard internal personnel for warehouse operations and procurement.'}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs backdrop-blur-md">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Customer Registration Fields */}
              {activeTab === 'customer_register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      disabled={submitting}
                      className="w-full px-3.5 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="+91-98765-43210"
                          disabled={submitting}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4 w-4" />
                        </div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@domain.com"
                          disabled={submitting}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Shipping / Delivery Address
                    </label>
                    <div className="relative">
                      <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Plot 42, Sector 18, Gurugram, HR"
                        disabled={submitting}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Staff Registration Fields */}
              {activeTab === 'staff_register' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Amit"
                        disabled={submitting}
                        className="w-full px-3.5 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Verma"
                        disabled={submitting}
                        className="w-full px-3.5 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Work Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="employee@omnistock.com"
                        disabled={submitting}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                      Department Persona
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        disabled={submitting}
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900/90 border border-slate-700/70 text-white rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="INVENTORY_MANAGER">Inventory Manager (Stock &amp; Catalog)</option>
                        <option value="WAREHOUSE_MANAGER">Warehouse Manager (Transfers &amp; Hubs)</option>
                        <option value="PROCUREMENT_MANAGER">Procurement Manager (Purchasing &amp; PO)</option>
                        <option value="ORDER_MANAGER">Order Manager (Fulfillment)</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* Username / Identifier */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  {activeTab === 'signin' ? 'Email or Username' : 'Account Username *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={activeTab === 'signin' ? 'Enter username or work email' : 'Choose unique username'}
                    disabled={submitting}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    Password *
                  </label>
                  {activeTab === 'signin' && (
                    <button
                      type="button"
                      onClick={() => alert('Please contact your system administrator to reset your credentials.')}
                      className="text-[11px] font-medium text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={submitting}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900/70 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-xs transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {activeTab === 'signin' && (
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      id="remember_me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900 rounded"
                    />
                    <span className="text-xs text-slate-400 font-medium">Keep me signed in</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">TLS 1.3</span>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:opacity-50 text-white font-medium text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authenticating Node...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {activeTab === 'signin' && 'Sign In to Workspace'}
                      {activeTab === 'customer_register' && 'Register & Access Portal'}
                      {activeTab === 'staff_register' && 'Create Staff Credentials'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Toggle Link */}
            {activeTab === 'signin' && (
              <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Need self-service customer access?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer_register');
                    setErrorMessage(null);
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer ml-1"
                >
                  Create a Customer Account
                </button>
              </div>
            )}

            {activeTab !== 'signin' && (
              <div className="pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMessage(null);
                  }}
                  className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer ml-1"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>

          {/* Right Bottom Encryption Seal */}
          <div className="text-center text-xs text-slate-500 flex items-center justify-center gap-2 pt-6">
            <ShieldCheck className="h-4 w-4 text-emerald-400/80" />
            <span>Enterprise 256-bit HSM Encrypted Session</span>
          </div>
        </div>
      </div>
    </div>
  );
};
