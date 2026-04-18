import groupService from '../groupService';

vi.mock('../../client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from '../../client';

describe('groupService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getGroups', () => {
    it('fetches all groups', async () => {
      const mockData = { groups: [{ id: '1', name: 'DevTeam' }] };
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await groupService.getGroups();

      expect(apiClient.get).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });
  });

  describe('searchGroups', () => {
    it('calls search endpoint with term', async () => {
      const mockData = [{ id: '1', name: 'DevTeam' }];
      apiClient.get.mockResolvedValue({ data: mockData });

      const result = await groupService.searchGroups('dev');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q=dev')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('createGroup', () => {
    it('posts new group data', async () => {
      const groupData = { name: 'QA Team', permissions: ['inventory:ro'] };
      const mockResponse = { id: '2', ...groupData };
      apiClient.post.mockResolvedValue({ data: mockResponse });

      const result = await groupService.createGroup(groupData);

      expect(apiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        groupData
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateGroup', () => {
    it('puts updated group data by id', async () => {
      const groupData = { name: 'QA Team Updated' };
      apiClient.put.mockResolvedValue({ data: { id: '2', ...groupData } });

      const result = await groupService.updateGroup('2', groupData);

      expect(apiClient.put).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        groupData
      );
      expect(result).toEqual({ id: '2', name: 'QA Team Updated' });
    });
  });

  describe('deleteGroup', () => {
    it('deletes group with reason', async () => {
      apiClient.delete.mockResolvedValue({ data: { message: 'Group deleted' } });

      const result = await groupService.deleteGroup('2', 'Team disbanded');

      expect(apiClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        { data: { reason: 'Team disbanded' } }
      );
      expect(result).toEqual({ message: 'Group deleted' });
    });
  });
});
