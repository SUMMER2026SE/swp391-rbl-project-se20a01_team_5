import { apiClient } from './apiClient';
import { mockGetReports, mockUpdateReportStatus } from './mocks/adminReports.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const adminReportsService = {
  getReports: async () => {
    if (USE_MOCK) return await mockGetReports();
    return await apiClient('/admin/reports');
  },
  
  updateStatus: async (id, status) => {
    if (USE_MOCK) return await mockUpdateReportStatus(id, status);
    return await apiClient(`/admin/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};
