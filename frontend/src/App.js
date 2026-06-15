import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import HospitalOps from './pages/HospitalOps';
import MedicalStore from './pages/MedicalStore';
import Billing from './pages/Billing';
import Payments from './pages/Payments';
import Finance from './pages/Finance';
import Predictions from './pages/Predictions';
import AgentActivity from './pages/AgentActivity';
import PatientsList from './pages/PatientsList';
import Reports from './pages/Reports';
import DepartmentDetail from './pages/DepartmentDetail';
import DoctorProfile from './pages/DoctorProfile';
import MyProfile from './pages/MyProfile';
import DiseasePrediction from './pages/DiseasePrediction';
import UfoChatWidget from './components/UfoChatWidget';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

// Guard for admin-only routes — redirects patients back to dashboard
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (user?.role === 'patient') return <Navigate to="/dashboard" />;
  return children;
};

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'} p-8`}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/department/:name" element={<DepartmentDetail />} />
          <Route path="/doctor/:id" element={<DoctorProfile />} />
          <Route path="/my-profile" element={<MyProfile />} />
          <Route path="/predict-disease" element={<DiseasePrediction />} />
          
          {/* Admin-only routes */}
          <Route path="/hospital-ops" element={<AdminRoute><HospitalOps /></AdminRoute>} />
          <Route path="/medical-store" element={<AdminRoute><MedicalStore /></AdminRoute>} />
          <Route path="/patients" element={<AdminRoute><PatientsList /></AdminRoute>} />
          <Route path="/billing" element={<AdminRoute><Billing /></AdminRoute>} />
          <Route path="/finance" element={<AdminRoute><Finance /></AdminRoute>} />
          <Route path="/predictions" element={<AdminRoute><Predictions /></AdminRoute>} />
          <Route path="/agents" element={<AdminRoute><AgentActivity /></AdminRoute>} />
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
        </Routes>
        <UfoChatWidget />
      </Router>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </AuthProvider>
  );
}

export default App;
