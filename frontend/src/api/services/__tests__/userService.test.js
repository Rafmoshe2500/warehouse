import userService from '../userService';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
  },
}));

import apiClient from '../../client';

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('calls search endpoint with encoded query', async () => {
      const mockData = [{ id: '1', username: 'alice' }];
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await userService.searchUsers('alice');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q=alice')
      );
      expect(result).toEqual(mockData);
    });

    it('URL-encodes the query string', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      await userService.searchUsers('john doe');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q=john%20doe')
      );
    });

    it('returns empty array when no results', async () => {
      apiClient.get.mockResolvedValue({ data: [] });

      const result = await userService.searchUsers('ZZZNONEXISTENT');

      expect(result).toEqual([]);
    });
  });
});
