import { apiClient } from './apiClient';
import { 
  mockGetRoutes, 
  mockGetRouteStops, 
  mockAddStop, 
  mockUpdateStop, 
  mockDeleteStop 
} from './mocks/coordinatorRoutes.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const coordinatorRoutesService = {
  getRoutes: async () => {
    if (USE_MOCK) return await mockGetRoutes();
    return await apiClient('/coordinator/routes');
  },
  
  getRouteStops: async (routeId) => {
    if (USE_MOCK) return await mockGetRouteStops(routeId);
    return await apiClient(`/coordinator/routes/${routeId}/stops`);
  },

  addStop: async (routeId, stopData) => {
    if (USE_MOCK) return await mockAddStop(routeId, stopData);
    return await apiClient(`/coordinator/routes/${routeId}/stops`, {
      method: 'POST',
      body: JSON.stringify(stopData)
    });
  },

  updateStop: async (routeId, stopData) => {
    if (USE_MOCK) return await mockUpdateStop(routeId, stopData);
    return await apiClient(`/coordinator/routes/${routeId}/stops/${stopData.id}`, {
      method: 'PUT',
      body: JSON.stringify(stopData)
    });
  },

  deleteStop: async (routeId, stopId) => {
    if (USE_MOCK) return await mockDeleteStop(routeId, stopId);
    return await apiClient(`/coordinator/routes/${routeId}/stops/${stopId}`, {
      method: 'DELETE'
    });
  }
};
