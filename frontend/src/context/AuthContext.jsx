import React, { createContext, useContext, useMemo, useCallback } from 'react';
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

  const hasPermission = useCallback((permission) => {
    // 1. SuperAdmin / Admin has full access
    if (isSuperAdmin || isAdmin) return true;
    
    // 2. Exact match
    if (user?.permissions?.includes(permission)) return true;

    // 3. Hierarchy check: 'inventory:rw' implies 'inventory:ro'
    if (permission.endsWith(':ro')) {
      const rwPermission = permission.replace(':ro', ':rw');
      if (user?.permissions?.includes(rwPermission)) return true;
    }

    return false;
  }, [user?.permissions, isSuperAdmin, isAdmin]);

  // Memoize only the stable values, not the mutation functions
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    permissions: user?.permissions || [],
    hasPermission,
    loading: isLoading,
    login, // Mutation functions - intentionally not in deps
    logout, // Mutation functions - intentionally not in deps
  }), [user, isAuthenticated, isAdmin, isSuperAdmin, hasPermission, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

