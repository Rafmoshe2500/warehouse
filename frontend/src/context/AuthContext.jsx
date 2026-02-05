import React, { createContext, useContext } from 'react';
import { useAuthQuery } from '../hooks/useAuthQuery';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading, 
    login, 
    logout 
  } = useAuthQuery();

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
    loading: isLoading, // Keeping 'loading' name for compatibility
    login,
    logout,
  };

  if (isLoading) {
      // Optional: Render a global loading spinner here if you want to block the app until auth is checked
      // For now, we pass the loading state down so components can decide
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

