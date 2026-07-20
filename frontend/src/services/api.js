import { apiFetch } from '@/lib/api/client';

export const travelApi = {
  getHistory({ page = 0, size = 20 } = {}) {
    return apiFetch.get('/students/me/travel-history', { page, size });
  },
};

export const notificationApi = {
  listMine({ page = 0, size = 20 } = {}) {
    return apiFetch.get('/notifications/me', { page, size });
  },
  getUnreadCount() {
    return apiFetch.get('/notifications/me/unread-count');
  },
  markRead(notificationId) {
    return apiFetch.post(`/notifications/${notificationId}/read`);
  },
};

export const lostItemApi = {
  listMine({ page = 0, size = 20 } = {}) {
    return apiFetch.get('/students/me/lost-items', { page, size });
  },
  submit(payload) {
    return apiFetch.post('/students/me/lost-items', payload);
  },
};

export const ticketingApi = {
  createVnpayPaymentUrl(payload = {}) {
    return apiFetch.post('/students/me/payments/vnpay-url', payload);
  },
  completeMockVnpayPayment(paymentId) {
    return apiFetch.post(`/students/me/payments/mock-vnpay/${paymentId}/complete`);
  },
  failMockVnpayPayment(paymentId) {
    return apiFetch.post(`/students/me/payments/mock-vnpay/${paymentId}/fail`);
  },
};

export const adminMonthlyPassApi = {
  list({ keyword = '', status = 'ACTIVE' } = {}) {
    const query = {};
    if (keyword) query.keyword = keyword;
    if (status && status !== 'ALL') query.status = status;
    return apiFetch.get('/admin/monthly-passes', query);
  },
  cancel(monthlyPassId) {
    return apiFetch.post(`/admin/monthly-passes/${monthlyPassId}/cancel`);
  },
};
