import { apiClient } from './apiClient';
import { mockGetHistory } from './mocks/history.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const historyService = {
  getHistory: async () => {
    if (USE_MOCK) {
      return await mockGetHistory();
    }
    return await apiClient('/history');
  }
};
