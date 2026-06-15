import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, ArrowRight } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [department, setDepartment] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, role, department, specialization);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-primary-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-hospital-purple rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join MNH Hospital Operating System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-black/5 p-8 border border-gray-100">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12" placeholder="John Doe" required />
              </div>
            </div>
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
                  className="input-field pl-12" placeholder="Min 6 characters" required minLength={6} />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {role === 'doctor' && (
              <div className="space-y-5 animate-slide-up">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)}
                    className="input-field" placeholder="e.g. Cardiology" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Specialization</label>
                  <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                    className="input-field" placeholder="e.g. Heart Surgeon" required />
                </div>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
