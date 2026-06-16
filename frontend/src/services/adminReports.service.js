import { apiClient } from './apiClient';
import { mockGetReports, mockUpdateReportStatus } from './mocks/adminReports.mock';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const adminReportsService = {
  getReports: async () => {
    if (USE_MOCK) return normalizeReports(await mockGetReports());
    const response = await apiClient('/admin/reports');
    return response.data ?? [];
  },
  
  updateStatus: async (id, status, resolution = '') => {
    if (USE_MOCK) {
      await mockUpdateReportStatus(id, status);
      return {
        id,
        code: typeof id === 'number' ? `CASE-${String(id).padStart(4, '0')}` : id,
        type: 'COMPLAINT',
        title: 'Dữ liệu mẫu đã cập nhật',
        content: resolution || 'Đã cập nhật trạng thái trong mock mode.',
        reporter: 'Mock user',
        targetUserId: null,
        target: 'Mock target',
        priority: 'NORMAL',
        status,
        resolution,
        createdAt: new Date().toISOString()
      };
    }
    return await apiClient(`/admin/reports/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, resolution })
    }).then((response) => response.data);
  },

  getNotes: async (id) => {
    if (USE_MOCK) return [];
    const response = await apiClient(`/admin/reports/${id}/notes`);
    return response.data ?? [];
  },

  addNote: async (id, content) => {
    if (USE_MOCK) return { id: Date.now(), sender: 'Admin', content, sentAt: new Date().toISOString() };
    const response = await apiClient(`/admin/reports/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return response.data;
  }
};

function normalizeReports(reports) {
  const typeMap = {
    violation: 'VIOLATION',
    complaint: 'COMPLAINT',
    system: 'SUPPORT'
  };
  const priorityMap = {
    high: 'HIGH',
    medium: 'NORMAL',
    low: 'LOW'
  };
  const statusMap = {
    pending: 'OPEN',
    resolved: 'RESOLVED',
    rejected: 'REJECTED'
  };
  return reports.map((report, index) => ({
    id: Number(String(report.id).replace(/\D/g, '')) || index + 1,
    code: report.id,
    type: typeMap[report.type] || 'COMPLAINT',
    title: report.title,
    category: report.type,
    content: report.content,
    reporter: report.reporter,
    targetUserId: null,
    target: report.target,
    priority: priorityMap[report.severity] || 'NORMAL',
    status: statusMap[report.status] || 'OPEN',
    resolution: '',
    handledBy: null,
    createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    closedAt: null
  }));
}
