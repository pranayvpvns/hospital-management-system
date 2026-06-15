import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { financeAPI } from '../services/api';
import { TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Finance = () => {
  const [summary, setSummary] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, deptRes] = await Promise.all([financeAPI.getSummary(), financeAPI.getDepartmentAnalytics()]);
        setSummary(sumRes.data);
        setDepartments(deptRes.data.departments);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="animate-fade-in">
      <TopBar title="Finance Analytics" subtitle="Revenue, expenses, and profit tracking" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg animate-slide-up">
          <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80">Total Revenue</p>
          <p className="text-3xl font-bold mt-1">₹{((summary?.total_revenue||0)/100000).toFixed(1)}L</p>
        </div>
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg animate-slide-up" style={{animationDelay:'100ms'}}>
          <TrendingDown className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80">Total Expenses</p>
          <p className="text-3xl font-bold mt-1">₹{((summary?.total_expense||0)/100000).toFixed(1)}L</p>
        </div>
        <div className="bg-gradient-to-br from-primary-500 to-hospital-purple rounded-2xl p-6 text-white shadow-lg animate-slide-up" style={{animationDelay:'200ms'}}>
          <IndianRupee className="w-8 h-8 mb-3 opacity-80" />
          <p className="text-sm opacity-80">Net Profit</p>
          <p className="text-3xl font-bold mt-1">₹{((summary?.net_profit||0)/100000).toFixed(1)}L</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expense</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={summary?.monthly||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{fontSize:12,fill:'#94A3B8'}} />
              <YAxis tick={{fontSize:12,fill:'#94A3B8'}} />
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E2E8F0'}} />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="expense" stroke="#F43F5E" fill="#F43F5E" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Revenue</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departments} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis type="number" tick={{fontSize:12,fill:'#94A3B8'}} />
              <YAxis dataKey="department" type="category" tick={{fontSize:11,fill:'#64748B'}} width={100} />
              <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E2E8F0'}} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[0,8,8,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={summary?.monthly||[]}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{fontSize:12,fill:'#94A3B8'}} />
            <YAxis tick={{fontSize:12,fill:'#94A3B8'}} />
            <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E2E8F0'}} />
            <Area type="monotone" dataKey="profit" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} strokeWidth={2.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Finance;
