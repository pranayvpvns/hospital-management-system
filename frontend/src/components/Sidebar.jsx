import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarDays, Building2,
  Receipt, CreditCard, TrendingUp, Brain, Bot, Pill,
  LogOut, ChevronLeft, ChevronRight, Heart, Shield, FileText
} from 'lucide-react';

const Sidebar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const patientLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/reports', icon: Building2, label: 'My Reports' },
    { to: '/predict-disease', icon: Brain, label: 'Disease Prediction' },
  ];

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hospital-ops', icon: Building2, label: 'Operations' },
    { to: '/medical-store', icon: Pill, label: 'Medical Store' },
    { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
    { to: '/patients', icon: Users, label: 'Patients' },
    { to: '/reports', icon: FileText, label: 'Reports' },
    { to: '/billing', icon: Receipt, label: 'Billing' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/finance', icon: TrendingUp, label: 'Finance' },
    { to: '/predictions', icon: Brain, label: 'AI Predictions' },
    { to: '/agents', icon: Bot, label: 'Agent Activity' },
  ];

  const links = user?.role === 'admin' || user?.role === 'doctor' ? adminLinks : patientLinks;

  return (
    <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-100 z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex flex-col shadow-sm`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-hospital-purple rounded-xl flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-gray-900">MNH</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">Hospital OS</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
            title={link.label}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{link.label}</span>}
          </NavLink>
        ))}
      </nav>



      {/* User & Logout */}
      <div className="p-4 border-t border-gray-100">
        {!collapsed && (
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-hospital-purple rounded-xl flex items-center justify-center text-white font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                {user?.role}
              </p>
            </div>
          </div>
        )}
        <button onClick={handleLogout} className="nav-link w-full text-rose-500 hover:bg-rose-50 hover:text-rose-600" title="Logout">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </div>
  );
};

export default Sidebar;
