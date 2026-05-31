import { apiClient } from './apiClient';
import { mockGetScheduleData } from './mocks/schedule.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const scheduleService = {
  getScheduleData: async () => {
    if (USE_MOCK) {
      return await mockGetScheduleData();
    }
    return await apiClient('/schedules/data');
  },
  saveShifts: async (shifts) => {
    if (USE_MOCK) {
      return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 800));
    }
    return await apiClient('/schedules', {
      method: 'POST',
      body: JSON.stringify({ shifts })
    });
  }
};
