import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, ArrowRight, ArrowLeft, Sparkles, ShieldCheck, UserRound } from 'lucide-react';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null); // null | 'admin' | 'patient'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, selectedRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  const handleBack = () => {
    setSelectedRole(null);
    setEmail('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-hospital-purple relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NDEtOC4wNTktMTgtMTgtMThTMCA4LjA1OSAwIDE4czguMDU5IDE4IDE4IDE4IDE4LTguMDU5IDE4LTE4Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
            MNH Hospital<br />Operating System
          </h1>
          <p className="text-lg text-primary-200 mb-8 max-w-md">
            Autonomous AI-powered hospital management with intelligent agents, predictive analytics, and seamless automation.
          </p>
          <div className="flex items-center gap-3 text-primary-200">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Powered by Azure AI & Multi-Agent Intelligence</span>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
      </div>

      {/* Right - Role Selection / Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 relative overflow-hidden">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-hospital-purple rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">MNH Hospital OS</h1>
          </div>

          {/* ===== ROLE SELECTION SCREEN ===== */}
          {!selectedRole && (
            <div className="animate-fade-in">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome</h2>
              <p className="text-gray-500 mb-10">Please select your role to continue</p>

              <div className="space-y-4">
                {/* Admin Button */}
                <button
                  id="role-select-admin"
                  onClick={() => setSelectedRole('admin')}
                  className="w-full group relative bg-white border-2 border-gray-200 hover:border-primary-500 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 cursor-pointer"
                  style={{ outline: 'none' }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <ShieldCheck className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">Admin</h3>
                    <p className="text-sm text-gray-500 mt-0.5">Hospital management & operations</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300" />
                </button>

                {/* Patient Button */}
                <button
                  id="role-select-patient"
                  onClick={() => setSelectedRole('patient')}
                  className="w-full group relative bg-white border-2 border-gray-200 hover:border-emerald-500 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 cursor-pointer"
                  style={{ outline: 'none' }}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <UserRound className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Patient</h3>
                    <p className="text-sm text-gray-500 mt-0.5">View appointments & health records</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300" />
                </button>
              </div>

              <div className="mt-10 p-4 bg-primary-50 rounded-xl">
                <p className="text-xs font-semibold text-primary-700 mb-2">Demo Credentials:</p>
                <p className="text-xs text-primary-600">Admin: admin@mnh.com / admin123</p>
                <p className="text-xs text-primary-600">Patient: rahul@email.com / patient123</p>
              </div>
            </div>
          )}

          {/* ===== LOGIN FORM SCREEN ===== */}
          {selectedRole && (
            <div className="animate-slide-in">
              {/* Back button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors group cursor-pointer"
                style={{ outline: 'none' }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to role selection
              </button>

              {/* Role badge */}
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  selectedRole === 'admin' 
                    ? 'bg-gradient-to-br from-primary-500 to-primary-700' 
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}>
                  {selectedRole === 'admin' 
                    ? <ShieldCheck className="w-5 h-5 text-white" /> 
                    : <UserRound className="w-5 h-5 text-white" />
                  }
                </div>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                  selectedRole === 'admin'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedRole === 'admin' ? 'Admin Login' : 'Patient Login'}
                </span>
              </div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
              <p className="text-gray-500 mb-8">Sign in to your {selectedRole} account to continue</p>

              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium animate-slide-up">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-12" placeholder="you@example.com" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-12" placeholder="••••••••" required />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all duration-300 disabled:opacity-50 cursor-pointer ${
                    selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25'
                  }`}>
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">Create one</Link>
              </p>

              <div className="mt-8 p-4 bg-primary-50 rounded-xl">
                <p className="text-xs font-semibold text-primary-700 mb-2">Demo Credentials:</p>
                {selectedRole === 'admin' ? (
                  <p className="text-xs text-primary-600">Admin: admin@mnh.com / admin123</p>
                ) : (
                  <p className="text-xs text-primary-600">Patient: rahul@email.com / patient123</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
