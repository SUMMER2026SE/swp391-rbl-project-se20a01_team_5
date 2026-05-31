import { apiClient } from './apiClient';
import { mockGetFleetStatus } from './mocks/fleet.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const fleetService = {
  getLiveFleetStatus: async () => {
    if (USE_MOCK) return await mockGetFleetStatus();
    return await apiClient('/coordinator/fleet/live');
  }
};
