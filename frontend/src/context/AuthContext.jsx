import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useAuthQuery } from '../hooks/useAuthQuery';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { 
    user, 
    isLoading, 
    login, 
    logout 
  } = useAuthQuery();

  const isAuthenticated = !!user;

  const isAdmin = !!(user?.role === 'admin' || user?.role === 'superadmin' || user?.permissions?.includes('admin'));
  const isSuperAdmin = user?.role === 'superadmin';

  const hasPermission = useCallback((permission) => {
    // 1. SuperAdmin / Admin has full access
    if (isSuperAdmin || isAdmin) return true;

    // Guard: no permission specified → deny
    if (!permission) return false;

    // 2. Exact match
    if (user?.permissions?.includes(permission)) return true;

    // 3. Hierarchy check: 'inventory:rw' implies 'inventory:ro'
    if (permission.endsWith(':ro')) {
      const rwPermission = permission.replace(':ro', ':rw');
      if (user?.permissions?.includes(rwPermission)) return true;
    }

    return false;
  }, [user?.permissions, isSuperAdmin, isAdmin]);

  /**
   * Check if the user can see/edit orders for a specific vendor.
   * Global procurement:ro / procurement:rw always grants vendor access.
   * mode: 'ro' | 'rw'
   */
  const hasVendorAccess = useCallback((vendor, mode = 'ro') => {
    if (isSuperAdmin || isAdmin) return true;
    // Global procurement access implies vendor access
    if (hasPermission(`procurement:${mode}`)) return true;
    // Vendor-specific permission
    return hasPermission(`procurement:${vendor.toLowerCase()}:${mode}`);
  }, [hasPermission, isSuperAdmin, isAdmin]);

  /**
   * Check if user is allowed to see price fields.
   * procurement:rw grants price access implicitly (full access).
   */
  const hasPricePermission = useCallback(() => {
    if (isSuperAdmin || isAdmin) return true;
    return (
      hasPermission('procurement:view_prices') ||
      hasPermission('procurement:rw')
    );
  }, [hasPermission, isSuperAdmin, isAdmin]);

  /**
   * Check if user has ANY procurement access (global or vendor-specific).
   * Used to show/hide the procurement tab, nav link and dashboard cards.
   */
  const hasProcurementAccess = useCallback(() => {
    if (isSuperAdmin || isAdmin) return true;
    if (hasPermission('procurement:ro') || hasPermission('procurement:rw')) return true;
    // Any vendor-specific permission grants access (dynamic — matches any procurement:<vendor>:ro/rw)
    const perms = user?.permissions || [];
    return perms.some(p => /^procurement:[a-z0-9_-]+:(ro|rw)$/.test(p));
  }, [hasPermission, isSuperAdmin, isAdmin, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Memoize only the stable values, not the mutation functions
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isAdmin,
    isSuperAdmin,
    permissions: user?.permissions || [],
    hasPermission,
    hasVendorAccess,
    hasPricePermission,
    hasProcurementAccess,
    loading: isLoading,
    login,
    logout,
  }), [user, isAuthenticated, isAdmin, isSuperAdmin, hasPermission, hasVendorAccess, hasPricePermission, hasProcurementAccess, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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

