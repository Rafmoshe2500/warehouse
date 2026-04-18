import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsers } from '../useUsers';

vi.mock('../../api/services/adminService', () => ({
  default: {
    getUsers: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

import adminService from '../../api/services/adminService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUsers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns empty users array initially, then loads users', async () => {
    const mockUsers = [{ id: '1', username: 'alice' }, { id: '2', username: 'bob' }];
    adminService.getUsers.mockResolvedValue({ users: mockUsers });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual(mockUsers);
  });

  it('returns empty array when API returns no users', async () => {
    adminService.getUsers.mockResolvedValue({});

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.users).toEqual([]);
  });

  it('createUser calls adminService.createUser', async () => {
    adminService.getUsers.mockResolvedValue({ users: [] });
    const newUser = { username: 'charlie', role: 'user' };
    adminService.createUser.mockResolvedValue({ id: '3', ...newUser });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    await act(async () => {
      await result.current.createUser(newUser);
    });

    expect(adminService.createUser).toHaveBeenCalledWith(newUser);
  });

  it('updateUser calls adminService.updateUser with id and data', async () => {
    adminService.getUsers.mockResolvedValue({ users: [] });
    adminService.updateUser.mockResolvedValue({ id: '1', role: 'admin' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    await act(async () => {
      await result.current.updateUser({ id: '1', data: { role: 'admin' } });
    });

    expect(adminService.updateUser).toHaveBeenCalledWith('1', { role: 'admin' });
  });

  it('deleteUser calls adminService.deleteUser with id and reason', async () => {
    adminService.getUsers.mockResolvedValue({ users: [] });
    adminService.deleteUser.mockResolvedValue({ message: 'Deleted' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    await act(async () => {
      await result.current.deleteUser({ id: '1', reason: 'Left company' });
    });

    expect(adminService.deleteUser).toHaveBeenCalledWith('1', 'Left company');
  });

  it('exposes isPending flags for mutations', () => {
    adminService.getUsers.mockResolvedValue({ users: [] });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useUsers(), { wrapper });

    // Initially not pending
    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
