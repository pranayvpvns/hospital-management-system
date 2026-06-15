import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import StatsCard from '../components/StatsCard';
import PatientDashboard from './PatientDashboard';
import { dashboardAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, BedDouble, CalendarDays, IndianRupee, AlertTriangle,
  Pill, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const COLORS = ['#6366F1', '#3B82F6', '#14B8A6', '#F59E0B', '#F43F5E', '#8B5CF6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardAPI.getStats();
        setStats(res.data?.data || res.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user?.role === 'patient') {
    return <PatientDashboard />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'doctor';

  return (
    <div className="animate-fade-in">
      <TopBar
        title={isAdmin ? 'Hospital Dashboard' : 'My Dashboard'}
        subtitle={isAdmin ? 'Real-time hospital overview & analytics' : `Welcome back, ${user?.name}`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatsCard icon={Users} label="Total Patients" value={stats?.total_patients || 0}
          trend="up" trendValue="+12%" color="blue" delay={0} />
        <StatsCard icon={BedDouble} label="Bed Occupancy" value={`${stats?.bed_occupancy_rate || 0}%`}
          trend={stats?.bed_occupancy_rate > 80 ? 'up' : 'down'} trendValue={`${stats?.occupied_beds}/${stats?.total_beds}`} color="purple" delay={100} />
        <StatsCard icon={CalendarDays} label="Today's Appointments" value={stats?.appointments_today || 0}
          trend="up" trendValue="+5" color="teal" delay={200} />
        <StatsCard icon={IndianRupee} label="Net Revenue" value={`₹${((stats?.total_revenue || 0) / 1000).toFixed(0)}K`}
          trend="up" trendValue="+8%" color="amber" delay={300} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Revenue Trend</h3>
          <p className="text-sm text-gray-500 mb-4">Last 7 days performance</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats?.revenue_trend || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bed Occupancy Pie */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '100ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Bed Occupancy</h3>
          <p className="text-sm text-gray-500 mb-4">By ward distribution</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats?.bed_occupancy || []}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={90}
                paddingAngle={3}
                dataKey="occupied"
                nameKey="ward"
              >
                {(stats?.bed_occupancy || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-hospital-amber" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            {(stats?.alerts || []).map((alert, i) => (
              <div key={i} className={`p-4 rounded-xl border-l-4 ${
                alert.type === 'danger' ? 'bg-rose-50 border-hospital-rose' :
                alert.type === 'warning' ? 'bg-amber-50 border-hospital-amber' :
                alert.type === 'success' ? 'bg-emerald-50 border-emerald-500' :
                'bg-blue-50 border-hospital-blue'
              }`}>
                <p className="font-semibold text-sm text-gray-900">{alert.title}</p>
                <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-500" />
            Hospital Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Total Staff</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.total_staff || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Pending Bills</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.pending_bills || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-100 rounded-lg flex items-center justify-center">
                  <Pill className="w-4 h-4 text-rose-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Expiring Medicines</span>
              </div>
              <span className="text-lg font-bold text-gray-900">{stats?.expiring_medicines || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Net Profit</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">₹{((stats?.net_profit || 0) / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
