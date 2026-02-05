import React, { createContext, useState, useEffect, useContext } from 'react';
import authService from '../api/services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashToken = params.get('hashToken');
    if (hashToken) {
      domainLogin(hashToken).catch(console.error);
      return;
    }

    checkAuth();
  }, []); // רק פעם אחת בטעינה

  const checkAuth = async () => {
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const data = await authService.login(username, password);
    // Fetch full user data after login
    const userData = await authService.getMe();
    setUser(userData);
    setIsAuthenticated(true);
    return data;
  };

  const domainLogin = async (hash_token) => {
    try {
      const data = await authService.domainLogin(hash_token);
      // Fetch full user data after login
      const userData = await authService.getMe();
      setUser(userData);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin' || user?.permissions?.includes('admin');
  const isSuperAdmin = user?.role === 'superadmin';

  const hasPermission = (permission) => {
    if (isSuperAdmin) return true;
    return user?.permissions?.includes(permission) || false;
  };

  const value = {
    user,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    permissions: user?.permissions || [],
    hasPermission,
    loading,
    login,
    domainLogin,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

