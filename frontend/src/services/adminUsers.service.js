import { apiClient } from './apiClient';
import { mockGetUsers, mockToggleUserLock, mockAddUser } from './mocks/adminUsers.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const adminUsersService = {
  getUsers: async () => {
    if (USE_MOCK) return normalizeUsers(await mockGetUsers());
    const response = await apiClient('/admin/users');
    return response.data ?? [];
  },

  getUser: async (id) => {
    const response = await apiClient(`/admin/users/${id}`);
    return response.data;
  },
  
  toggleLock: async (id, status, reason = '') => {
    if (USE_MOCK) {
      const nextStatus = status === 'ACTIVE' || status === 'active' ? 'LOCKED' : 'ACTIVE';
      return { id, status: nextStatus, lockReason: nextStatus === 'LOCKED' ? reason : null };
    }
    const nextStatus = status === 'ACTIVE' || status === 'active' ? 'LOCKED' : 'ACTIVE';
    return await apiClient(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: nextStatus, reason })
    }).then((response) => response.data);
  },

  addUser: async (userData) => {
    if (USE_MOCK) {
      await mockAddUser(userData);
      return {
        id: Date.now(),
        code: `NV${Date.now().toString().slice(-5)}`,
        name: userData.fullName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        status: 'ACTIVE',
        lockReason: null,
        joinedAt: new Date().toISOString()
      };
    }
    return await apiClient('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }).then((response) => response.data);
  }
};

function normalizeUsers(users) {
  const roleMap = {
    'Sinh viÃªn': 'STUDENT',
    'Sinh viên': 'STUDENT',
    'TÃ i xáº¿': 'DRIVER',
    'Tài xế': 'DRIVER',
    'Phá»¥ xe': 'CONDUCTOR',
    'Phụ xe': 'CONDUCTOR',
    'Äiá»u phá»‘i': 'DISPATCHER',
    'Điều phối': 'DISPATCHER'
  };
  return users.map((user, index) => ({
    id: Number(String(user.id).replace(/\D/g, '').slice(-6)) || index + 1,
    code: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber || '',
    role: roleMap[user.role] || user.role || 'STUDENT',
    status: user.status === 'locked' ? 'LOCKED' : 'ACTIVE',
    lockReason: user.status === 'locked' ? 'Tài khoản bị khóa trong dữ liệu mẫu' : null,
    joinedAt: user.joined
  }));
}
