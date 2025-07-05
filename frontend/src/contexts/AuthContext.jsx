// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (savedToken && savedUser) {
        try {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
          
          // Verify token is still valid
          await apiService.getCurrentUser();
          console.log('✅ User authenticated from storage');
        } catch (error) {
          console.log('❌ Stored token invalid, clearing auth state');
          clearAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login...');
      const response = await apiService.login({ email, password });
      
      const { access_token, user: userData } = response;
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setToken(access_token);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name}! 🎉`);
      console.log('✅ Login successful');
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error);
      toast.error(`Login failed: ${error.message}`);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration...');
      const response = await apiService.register(userData);
      
      const { access_token, user: newUser } = response;
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      // Update state
      setToken(access_token);
      setUser(newUser);
      
      toast.success(`Welcome to FinanceApp, ${newUser.name}! 🎉`);
      console.log('✅ Registration successful');
      return true;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      toast.error(`Registration failed: ${error.message}`);
      return false;
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    clearAuth();
    toast.success('Successfully logged out! 👋');
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      const response = await apiService.refreshToken();
      const { access_token, user: userData } = response;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
      
      return true;
    } catch (error) {
      clearAuth();
      return false;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};