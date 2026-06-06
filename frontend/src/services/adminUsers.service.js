import { apiClient } from './apiClient';
import { mockGetUsers, mockToggleUserLock, mockAddUser } from './mocks/adminUsers.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const adminUsersService = {
  getUsers: async () => {
    if (USE_MOCK) return await mockGetUsers();
    return await apiClient('/admin/users');
  },
  
  toggleLock: async (id, status) => {
    if (USE_MOCK) return await mockToggleUserLock(id, status);
    return await apiClient(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  },

  addUser: async (userData) => {
    if (USE_MOCK) return await mockAddUser(userData);
    return await apiClient('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }
};
