import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationAPI, extractData } from '../services/api';
import {
  Bell, Search, ChevronDown, User, CalendarDays, CreditCard,
  FileText, LogOut, X, LayoutDashboard, Building2, Pill,
  Receipt, TrendingUp, Brain, Bot, Users, Clock, CheckCircle2, AlertTriangle, Info
} from 'lucide-react';

// Searchable pages for patients
const PATIENT_PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'overview', 'dashboard', 'welcome'] },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, keywords: ['appointment', 'book', 'doctor', 'schedule', 'visit'] },
  { label: 'Payments', path: '/payments', icon: CreditCard, keywords: ['payment', 'pay', 'bill', 'money', 'transaction'] },
  { label: 'My Reports', path: '/reports', icon: FileText, keywords: ['report', 'medical', 'history', 'record', 'test'] },
];

// Searchable pages for admins
const ADMIN_PAGES = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'overview', 'dashboard', 'analytics'] },
  { label: 'Operations', path: '/hospital-ops', icon: Building2, keywords: ['operation', 'hospital', 'bed', 'ward', 'staff'] },
  { label: 'Medical Store', path: '/medical-store', icon: Pill, keywords: ['medicine', 'pharmacy', 'drug', 'stock', 'store'] },
  { label: 'Appointments', path: '/appointments', icon: CalendarDays, keywords: ['appointment', 'book', 'schedule', 'patient'] },
  { label: 'Patients', path: '/patients', icon: Users, keywords: ['patient', 'list', 'record', 'register'] },
  { label: 'Billing', path: '/billing', icon: Receipt, keywords: ['billing', 'invoice', 'bill', 'charge', 'generate'] },
  { label: 'Payments', path: '/payments', icon: CreditCard, keywords: ['payment', 'pay', 'transaction', 'money'] },
  { label: 'Finance', path: '/finance', icon: TrendingUp, keywords: ['finance', 'revenue', 'expense', 'profit', 'analytics'] },
  { label: 'AI Predictions', path: '/predictions', icon: Brain, keywords: ['prediction', 'ai', 'ml', 'forecast', 'trend'] },
  { label: 'Agent Activity', path: '/agents', icon: Bot, keywords: ['agent', 'automation', 'bot', 'activity', 'log'] },
];

// Sample notifications are replaced with backend API calls

const NOTIF_ICONS = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  success: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
};

const TopBar = ({ title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin' || user?.role === 'doctor';

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getAll();
      const notifs = extractData(res, 'notifications') || [];
      // If we don't have human-readable times, we can format the ISO string, but for now we'll just parse it or fallback.
      const formatted = notifs.map(n => {
        let timeLabel = 'recently';
        if (n.created_at) {
          const dt = new Date(n.created_at);
          timeLabel = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return { ...n, time: timeLabel };
      });
      setNotifications(formatted);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  // Refs for click-outside
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search logic
  const pages = isAdmin ? ADMIN_PAGES : PATIENT_PAGES;
  const searchResults = searchQuery.trim().length > 0
    ? pages.filter(page => {
        const q = searchQuery.toLowerCase();
        return page.label.toLowerCase().includes(q) || page.keywords.some(k => k.includes(q));
      })
    : [];

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleNotifClick = async (id, read) => {
    if (!read) {
      try {
        await notificationAPI.markOneRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      } catch (err) {
        console.error('Failed to mark notification read', err);
      }
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate('/login');
  };

  const profileMenuItems = [
    { label: 'My Profile', icon: User, path: '/my-profile', description: 'View your profile' },
    { label: 'Appointments', icon: CalendarDays, path: '/appointments', description: 'Manage bookings' },
    { label: 'Payments', icon: CreditCard, path: '/payments', description: 'Payment history' },
    { label: 'Reports', icon: FileText, path: '/reports', description: 'Medical records' },
  ];

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* ===== SEARCH ===== */}
        <div className="relative hidden md:block" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="pl-10 pr-8 py-2.5 rounded-xl bg-white border border-gray-200 text-sm w-64 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Search Results Dropdown */}
          {searchOpen && searchQuery.trim().length > 0 && (
            <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Results</p>
                  {searchResults.map((page) => (
                    <button
                      key={page.path}
                      onClick={() => handleSearchSelect(page.path)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
                        <page.icon className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{page.label}</p>
                        <p className="text-[11px] text-gray-400">Navigate to {page.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { 
              const willOpen = !notifOpen;
              setNotifOpen(willOpen); 
              setProfileOpen(false); 
              if (willOpen) {
                fetchNotifications();
              }
            }}
            className="relative p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-hospital-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute top-full mt-2 right-0 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Notifications</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary-600 font-medium hover:text-primary-700 cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notif) => {
                  const config = NOTIF_ICONS[notif.type] || NOTIF_ICONS.info;
                  const NotifIcon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif.id, notif.read)}
                      className={`flex items-start gap-3 px-5 py-4 border-b border-gray-50 last:border-0 transition-colors cursor-pointer ${
                        !notif.read ? 'bg-primary-50/40' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-9 h-9 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <NotifIcon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                          {!notif.read && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0"></span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {notifications.length === 0 && (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ===== PROFILE ===== */}
        <div className="relative hidden md:block" ref={profileRef}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
            className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl border border-gray-200 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-hospital-purple rounded-lg flex items-center justify-center text-white font-semibold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
              <p className="text-[11px] text-gray-400 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-slide-up">
              {/* User header */}
              <div className="px-5 py-4 bg-gradient-to-r from-primary-600 to-hospital-purple">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-bold">{user?.name}</p>
                    <p className="text-primary-200 text-xs capitalize">{user?.role} Account</p>
                  </div>
                </div>
                {user?.email && (
                  <p className="text-primary-200 text-xs mt-2 truncate">{user.email}</p>
                )}
              </div>

              {/* Menu items */}
              <div className="py-2">
                {profileMenuItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setProfileOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                  >
                    <div className="w-9 h-9 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center transition-colors">
                      <item.icon className="w-4 h-4 text-gray-500 group-hover:text-primary-600 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">{item.label}</p>
                      <p className="text-[11px] text-gray-400">{item.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-rose-50 rounded-xl transition-colors text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 bg-rose-50 group-hover:bg-rose-100 rounded-xl flex items-center justify-center transition-colors">
                    <LogOut className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-sm font-semibold text-rose-600">Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;
