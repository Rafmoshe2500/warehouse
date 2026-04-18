import adminService from '../adminService';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../client';

describe('adminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('fetches all users', async () => {
      const mockData = { users: [{ id: '1', username: 'alice' }] };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await adminService.getUsers();

      expect(apiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('createUser', () => {
    it('posts new user data', async () => {
      const userData = { username: 'bob', role: 'user', permissions: [] };
      const mockResponse = { id: '2', ...userData };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await adminService.createUser(userData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        userData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateUser', () => {
    it('puts updated user data by id', async () => {
      const userData = { role: 'admin' };
      apiClient.put.mockResolvedValue({ data: { id: '1', ...userData } });

      const result = await adminService.updateUser('1', userData);

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.stringContaining('1'),
        userData
      );
      expect(result).toEqual({ id: '1', role: 'admin' });
    });
  });

  describe('deleteUser', () => {
    it('deletes user with reason', async () => {
      apiClient.delete.mockResolvedValue({ data: { message: 'User deleted' } });

      const result = await adminService.deleteUser('1', 'Account deactivated');

      expect(apiClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('1'),
        { data: { reason: 'Account deactivated' } }
      );
      expect(result).toEqual({ message: 'User deleted' });
    });
  });

  describe('getStats', () => {
    it('fetches admin stats', async () => {
      const mockStats = { total_users: 10, active: 8 };
      apiClient.get.mockResolvedValue({ data: mockStats });

      const result = await adminService.getStats();

      expect(apiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });
  });

  describe('changePassword', () => {
    it('puts current and new password', async () => {
      apiClient.put.mockResolvedValue({ data: { message: 'Password updated' } });

      const result = await adminService.changePassword('oldPass123', 'newPass456');

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.any(String),
        { current_password: 'oldPass123', new_password: 'newPass456' }
      );
      expect(result).toEqual({ message: 'Password updated' });
    });
  });
});
