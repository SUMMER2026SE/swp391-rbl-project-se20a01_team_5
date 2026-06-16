import { apiClient } from './apiClient';
import { 
  mockGetRoutes, 
  mockGetRouteStops, 
  mockAddStop, 
  mockUpdateStop, 
  mockDeleteStop,
  mockAddRoute
} from './mocks/coordinatorRoutes.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const coordinatorRoutesService = {
  getRoutes: async () => {
    if (USE_MOCK) return await mockGetRoutes();
    const res = await apiClient('/coordinator/routes');
    return res.data;
  },

  addRoute: async (routeData) => {
    if (USE_MOCK) return await mockAddRoute(routeData);
    const res = await apiClient('/coordinator/routes', {
      method: 'POST',
      body: JSON.stringify(routeData)
    });
    return res.data;
  },
  
  getRouteStops: async (routeId) => {
    if (USE_MOCK) return await mockGetRouteStops(routeId);
    const res = await apiClient(`/coordinator/routes/${routeId}/stops`);
    return res.data;
  },

  addStop: async (routeId, stopData) => {
    if (USE_MOCK) return await mockAddStop(routeId, stopData);
    const res = await apiClient(`/coordinator/routes/${routeId}/stops`, {
      method: 'POST',
      body: JSON.stringify(stopData)
    });
    return res.data;
  },

  updateStop: async (routeId, stopData) => {
    if (USE_MOCK) return await mockUpdateStop(routeId, stopData);
    const res = await apiClient(`/coordinator/routes/${routeId}/stops/${stopData.id}`, {
      method: 'PUT',
      body: JSON.stringify(stopData)
    });
    return res.data;
  },

  deleteStop: async (routeId, stopId) => {
    if (USE_MOCK) return await mockDeleteStop(routeId, stopId);
    const res = await apiClient(`/coordinator/routes/${routeId}/stops/${stopId}`, {
      method: 'DELETE'
    });
    return res;
  }
};
