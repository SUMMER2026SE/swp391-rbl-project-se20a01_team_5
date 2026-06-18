import { apiClient } from './apiClient';

export const coordinatorSchedulesService = {
  getAllSchedules: async () => {
    const res = await apiClient('/coordinator/schedules');
    return res.data;
  },

  getAvailableBuses: async () => {
    const res = await apiClient('/coordinator/schedules/buses');
    return res.data;
  },

  getAvailableDrivers: async () => {
    const res = await apiClient('/coordinator/schedules/drivers');
    return res.data;
  },

  getAvailableConductors: async () => {
    const res = await apiClient('/coordinator/schedules/conductors');
    return res.data;
  },

  createSchedule: async (scheduleData) => {
    const res = await apiClient('/coordinator/schedules', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
    return res.data;
  },

  updateSchedule: async (scheduleId, scheduleData) => {
    const res = await apiClient(`/coordinator/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData)
    });
    return res.data;
  },

  deleteSchedule: async (scheduleId) => {
    const res = await apiClient(`/coordinator/schedules/${scheduleId}`, {
      method: 'DELETE'
    });
    return res;
  }
};
