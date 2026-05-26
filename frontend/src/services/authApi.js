import axiosClient from '@/utils/axiosClient';

export const authApi = {
  login(payload) {
    return axiosClient.post('/auth/login', payload);
  },
};
