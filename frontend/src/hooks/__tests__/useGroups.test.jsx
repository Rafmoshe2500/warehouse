import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGroups } from '../useGroups';

vi.mock('../../api/services/groupService', () => ({
  default: {
    getGroups: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

import groupService from '../../api/services/groupService';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useGroups', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads groups from groupService', async () => {
    const mockGroups = [{ id: '1', name: 'DevTeam' }, { id: '2', name: 'QA' }];
    groupService.getGroups.mockResolvedValue({ groups: mockGroups });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.groups).toEqual(mockGroups);
  });

  it('returns empty array when API returns no groups', async () => {
    groupService.getGroups.mockResolvedValue({});

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.groups).toEqual([]);
  });

  it('createGroup calls groupService.createGroup', async () => {
    groupService.getGroups.mockResolvedValue({ groups: [] });
    groupService.createGroup.mockResolvedValue({ id: '3', name: 'NewGroup' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await act(async () => {
      await result.current.createGroup({ name: 'NewGroup', permissions: [] });
    });

    expect(groupService.createGroup).toHaveBeenCalledWith({ name: 'NewGroup', permissions: [] });
  });

  it('updateGroup calls groupService.updateGroup with id and data', async () => {
    groupService.getGroups.mockResolvedValue({ groups: [] });
    groupService.updateGroup.mockResolvedValue({ id: '1', name: 'Updated' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await act(async () => {
      await result.current.updateGroup({ id: '1', data: { name: 'Updated' } });
    });

    expect(groupService.updateGroup).toHaveBeenCalledWith('1', { name: 'Updated' });
  });

  it('deleteGroup calls groupService.deleteGroup with id and reason', async () => {
    groupService.getGroups.mockResolvedValue({ groups: [] });
    groupService.deleteGroup.mockResolvedValue({ message: 'Deleted' });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    await act(async () => {
      await result.current.deleteGroup({ id: '1', reason: 'Disbanded' });
    });

    expect(groupService.deleteGroup).toHaveBeenCalledWith('1', 'Disbanded');
  });

  it('exposes isPending flags for mutations', () => {
    groupService.getGroups.mockResolvedValue({ groups: [] });

    const wrapper = createWrapper();
    const { result } = renderHook(() => useGroups(), { wrapper });

    expect(result.current.isCreating).toBe(false);
    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
