import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let token = localStorage.getItem('mnh_token');
    
    // Clear corrupted tokens from previous bugs immediately
    if (token === 'undefined' || token === 'null') {
      localStorage.removeItem('mnh_token');
      token = null;
    }
    
    const savedUser = localStorage.getItem('mnh_user');
    if (token && savedUser && savedUser !== 'undefined') {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password, selectedRole) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    
    // Override the user's role with the role they selected on the login screen
    if (selectedRole && userData) {
      userData.role = selectedRole;
    }
    
    localStorage.setItem('mnh_token', token);
    localStorage.setItem('mnh_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password, role = 'patient', department = '', specialization = '') => {
    const res = await authAPI.register({ name, email, password, role, department, specialization });
    const { token, user: userData } = res.data;
    localStorage.setItem('mnh_token', token);
    localStorage.setItem('mnh_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('mnh_token');
    localStorage.removeItem('mnh_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
