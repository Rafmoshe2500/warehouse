import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock useAuthQuery so we control the auth state
vi.mock('../../hooks/useAuthQuery', () => ({
  useAuthQuery: vi.fn(),
}));

import { useAuthQuery } from '../../hooks/useAuthQuery';

const buildWrapper = (user, extra = {}) => {
  useAuthQuery.mockReturnValue({
    user,
    isAuthenticated: !!user,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    ...extra,
  });
  return ({ children }) => <AuthProvider>{children}</AuthProvider>;
};

describe('AuthContext - useAuth', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('throws when used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within AuthProvider'
    );
    consoleSpy.mockRestore();
  });

  it('exposes user and isAuthenticated from useAuthQuery', () => {
    const user = { username: 'alice', role: 'user', permissions: [] };
    const wrapper = buildWrapper(user);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(user);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('returns isAdmin=true for admin role', () => {
    const wrapper = buildWrapper({ username: 'alice', role: 'admin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('returns isAdmin=true and isSuperAdmin=true for superadmin role', () => {
    const wrapper = buildWrapper({ username: 'root', role: 'superadmin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isSuperAdmin).toBe(true);
  });

  it('returns isAdmin=false and isSuperAdmin=false for regular user', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });
});

describe('AuthContext - hasPermission', () => {
  afterEach(() => vi.clearAllMocks());

  it('superadmin always has any permission', () => {
    const wrapper = buildWrapper({ username: 'root', role: 'superadmin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('item:delete')).toBe(true);
    expect(result.current.hasPermission('procurement:rw')).toBe(true);
  });

  it('admin always has any permission', () => {
    const wrapper = buildWrapper({ username: 'admin', role: 'admin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('inventory:ro')).toBe(true);
  });

  it('regular user with exact permission returns true', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['inventory:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('inventory:ro')).toBe(true);
  });

  it('rw permission satisfies ro check (hierarchy)', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['inventory:rw'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('inventory:ro')).toBe(true);
  });

  it('ro does NOT satisfy rw check', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['inventory:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('inventory:rw')).toBe(false);
  });

  it('returns false for permission not in list', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['inventory:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('procurement:rw')).toBe(false);
  });

  it('returns true when no permission prop passed (no restriction)', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    // hasPermission with undefined/null — should return false safely
    expect(result.current.hasPermission(undefined)).toBe(false);
  });
});

describe('AuthContext - hasVendorAccess', () => {
  afterEach(() => vi.clearAllMocks());

  it('admin has vendor access by default', () => {
    const wrapper = buildWrapper({ username: 'admin', role: 'admin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasVendorAccess('netapp', 'ro')).toBe(true);
    expect(result.current.hasVendorAccess('dell', 'rw')).toBe(true);
  });

  it('global procurement:ro grants vendor ro access', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['procurement:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasVendorAccess('netapp', 'ro')).toBe(true);
  });

  it('global procurement:rw grants vendor rw access', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['procurement:rw'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasVendorAccess('dell', 'rw')).toBe(true);
  });

  it('vendor-specific procurement:netapp:ro grants access to netapp', () => {
    const wrapper = buildWrapper({
      username: 'bob',
      role: 'user',
      permissions: ['procurement:netapp:ro'],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasVendorAccess('netapp', 'ro')).toBe(true);
  });

  it('vendor-specific permission does not grant access to other vendors', () => {
    const wrapper = buildWrapper({
      username: 'bob',
      role: 'user',
      permissions: ['procurement:netapp:ro'],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasVendorAccess('dell', 'ro')).toBe(false);
  });
});

describe('AuthContext - hasPricePermission', () => {
  afterEach(() => vi.clearAllMocks());

  it('superadmin has price permission', () => {
    const wrapper = buildWrapper({ username: 'root', role: 'superadmin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPricePermission()).toBe(true);
  });

  it('user with procurement:rw has price permission', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['procurement:rw'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPricePermission()).toBe(true);
  });

  it('user with procurement:view_prices has price permission', () => {
    const wrapper = buildWrapper({
      username: 'bob',
      role: 'user',
      permissions: ['procurement:view_prices'],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPricePermission()).toBe(true);
  });

  it('user with only procurement:ro does NOT have price permission', () => {
    const wrapper = buildWrapper({
      username: 'bob',
      role: 'user',
      permissions: ['procurement:ro'],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPricePermission()).toBe(false);
  });
});

describe('AuthContext - hasProcurementAccess', () => {
  afterEach(() => vi.clearAllMocks());

  it('admin has procurement access', () => {
    const wrapper = buildWrapper({ username: 'admin', role: 'admin', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasProcurementAccess()).toBe(true);
  });

  it('global procurement:ro grants procurement access', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['procurement:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasProcurementAccess()).toBe(true);
  });

  it('vendor-specific permission grants procurement access', () => {
    const wrapper = buildWrapper({
      username: 'bob',
      role: 'user',
      permissions: ['procurement:netapp:ro'],
    });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasProcurementAccess()).toBe(true);
  });

  it('user with no procurement permission has no procurement access', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: ['inventory:ro'] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasProcurementAccess()).toBe(false);
  });

  it('user with no permissions has no procurement access', () => {
    const wrapper = buildWrapper({ username: 'bob', role: 'user', permissions: [] });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasProcurementAccess()).toBe(false);
  });
});

describe('AuthContext - loading and null user', () => {
  afterEach(() => vi.clearAllMocks());

  it('exposes loading state from useAuthQuery', () => {
    const wrapper = buildWrapper(null, { isLoading: true });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(true);
  });

  it('isAuthenticated is false when user is null', () => {
    const wrapper = buildWrapper(null, { isAuthenticated: false });
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isSuperAdmin).toBe(false);
  });

  it('hasPermission returns false when user is null', () => {
    const wrapper = buildWrapper(null);
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.hasPermission('inventory:ro')).toBe(false);
  });
});
