import { apiClient } from './apiClient';
import { mockGetRouteDetail } from './mocks/routeDetail.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const routeDetailService = {
  getRouteDetail: async (routeId) => {
    if (USE_MOCK) {
      return await mockGetRouteDetail(routeId);
    }
    return await apiClient(`/routes/${routeId}`);
  }
};
