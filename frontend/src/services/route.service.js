import { apiClient } from './apiClient';
import { mockGetRoutes } from './mocks/route.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const routeService = {
  getRoutes: async () => {
    if (USE_MOCK) {
      return await mockGetRoutes();
    }
    return await apiClient('/routes');
  }
};
