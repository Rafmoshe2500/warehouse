
import apiClient from '../client';

const userService = {
  searchUsers: async (query) => {
    const response = await apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }
};

export default userService;
